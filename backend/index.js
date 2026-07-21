const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');   
const multer = require('multer'); 
const path = require('path');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = '484477705574-o568rp2oru74m9bslul7oi88s92j6scp.apps.googleusercontent.com'; 
const client = new OAuth2Client(GOOGLE_CLIENT_ID);
require('dotenv').config();

const app = express();

// Middlewares
// Middlewares con límite de carga ampliado para soportar múltiples imágenes Base64
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors()); 

// ==========================================
// CONFIGURACIÓN DE MULTER (GUARDADO DE IMÁGENES)
// ==========================================
// Hacer que la carpeta 'uploads' sea accesible desde el navegador
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// dónde y con qué nombre se guardan los archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); 
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// middleware que se usa en las rutas para subir 1 o varias fotos
const upload = multer({ storage: storage });

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',      
    password: '',      
    database: 'bicicleteria_bd' 
});
// ==========================================================
// Probar la conexión
// ==========================================================
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos: ' + err.stack);
        return;
    }
    console.log('✅ Conectado a la base de datos de la Bicicletería Metola Bikes');
});
// ==========================================
// CONFIGURACIÓN DE NODEMAILER (ENVÍO DE EMAILS)
// ==========================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Probar conexión con Gmail al arrancar el servidor
transporter.verify().then(() => {
  console.log('📧 Cartero Nodemailer conectado y listo para enviar correos');
}).catch(err => {
  console.error('⚠️ Error al conectar Nodemailer con Gmail:', err);
});

// FUNCIÓN MAESTRA PARA ENVIAR CORREOS
const enviarCorreo = async (destinatario, asunto, mensajeHtml) => {
  try {
    const info = await transporter.sendMail({
      from: '"Metola Bikes Oficial" <' + process.env.EMAIL_USER + '>', // Remitente
      to: destinatario, // Correo del cliente
      subject: asunto, // Asunto del correo
      html: mensajeHtml // Cuerpo del correo en formato HTML
    });
    console.log(`✔ Correo enviado exitosamente a ${destinatario} (ID: ${info.messageId})`);
  } catch (error) {
    console.error('✖ Error al enviar el correo a', destinatario, error);
  }
};

// Clave secreta para firmar los tokens 
const JWT_SECRET = 'clave_secreta_para_desarrollo';
// ==========================================================
// --- RUTAS EXISTENTES ---
// ==========================================================
app.get('/', (req, res) => {
    res.send('El servidor de la Bicicletería está funcionando!');
});

// ==========================================================
// RUTA CATÁLOGO GENERAL (CON DETALLE DE VARIANTES)
// ==========================================================
app.get('/productos', (req, res) => {
  // Buscamos los productos y su stock total, PERO SOLO LOS ACTIVOS
  const queryProductos = `
    SELECT p.*, IFNULL(SUM(v.stock), 0) AS stock
    FROM productos p
    LEFT JOIN producto_variantes v ON p.id = v.id_producto
    WHERE p.estado = 'activo'
    GROUP BY p.id
  `;

  db.query(queryProductos, (err, products) => {
    if (err) return res.status(500).json({ error: 'Error obteniendo productos' });

    // Buscamos TODAS las variantes de la base de datos
    db.query('SELECT * FROM producto_variantes', (err, variants) => {
      if (err) return res.status(500).json({ error: 'Error obteniendo variantes' });

      // Le "pegamos" a cada producto su lista exacta de variantes (colores y talles con su stock)
      const productsWithVariants = products.map(p => {
        const pVariants = variants.filter(v => v.id_producto === p.id);
        return { ...p, variantes: pVariants };
      });

      res.json(productsWithVariants);
    });
  });
});
// ==========================================
// RUTA PARA REGISTRAR USUARIOS
// ==========================================
app.post('/api/auth/register', (req, res) => {
    const { nombre, email, contrasena, telefono, direccion, rol } = req.body;

    //VALIDACIÓN BACKEND: Verificamos la seguridad de la contraseña
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(contrasena)) {
        return res.status(400).json({ error: 'La contraseña no cumple con los requisitos de seguridad mínimos (8 caracteres, 1 mayúscula, 1 número).' });
    }

    if (!nombre || !email || !contrasena || !telefono || !direccion) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }
    // 1. Verificar si el email ya existe en la base de datos
    const consultarEmail = 'SELECT * FROM usuarios WHERE email = ?';
    
    db.query(consultarEmail, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en el servidor al verificar el correo.' });
        }

        if (results.length > 0) {
            return res.status(400).json({ error: 'El email ya está registrado.' });
        }

        // 2. Si el correo es libre, encriptamos la contraseña con bcryptjs
        const saltRounds = 10;
        bcrypt.hash(contrasena, saltRounds, (errHash, contrasenaEncriptada) => {
            if (errHash) {
                console.error(errHash);
                return res.status(500).json({ error: 'Error al procesar la contraseña.' });
            }

            // 3. Insertar el nuevo usuario en la base de datos
            const insertarQuery = 'INSERT INTO usuarios (nombre, email, contrasena, telefono, direccion, rol) VALUES (?, ?, ?, ?, ?, ?)';
            const valores = [nombre, email, contrasenaEncriptada, telefono, direccion, rol || 'cliente'];

            db.query(insertarQuery, valores, (errInsert, resultado) => {
                if (errInsert) {
                    console.error(errInsert);
                    return res.status(500).json({ error: 'Error al guardar el usuario en la base de datos.' });
                }

                // 4. Responder éxito al frontend
                return res.status(201).json({ mensaje: 'Usuario registrado con éxito.' });
            });
        });
    });
});
// ==========================================
// --- NUEVA RUTA: DÍA 2 - LOGIN ---
// ==========================================
app.post('/api/auth/login', (req, res) => {
    const { email, contrasena } = req.body;

    // 1. Buscar al usuario por email en tu base de datos
    const query = 'SELECT * FROM usuarios WHERE email = ?';
    
    db.query(query, [email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error en el servidor al buscar usuario.' });
        }

        // Si no se encuentra ningún usuario con ese email
        if (results.length === 0) {
            return res.status(400).json({ mensaje: 'El email o la contraseña son incorrectos.' });
        }

        const usuario = results[0];

        // 2. Verificar si la contraseña ingresada coincide con la guardada (encriptada)
        // NOTA: Si vas a meter un usuario manual a la DB para probar sin encriptar, mirá el paso de abajo.
        bcrypt.compare(contrasena, usuario.contrasena, (errBcrypt, passwordCorrecto) => {
            if (errBcrypt) {
                return res.status(500).json({ error: 'Error al verificar la contraseña.' });
            }

            if (!passwordCorrecto) {
                return res.status(400).json({ mensaje: 'El email o la contraseña son incorrectos.' });
            }

            // 3. Si todo está bien, generar el Token (JWT) con id y rol
            const payload = {
                id: usuario.id,
                rol: usuario.rol
            };

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

            // 4. Devolver el token al frontend
            return res.status(200).json({
                mensaje: 'Login exitoso',
                token: token
            });
        });
    });
});
// ==========================================
// RUTA: LOGIN Y REGISTRO CON GOOGLE 
// ==========================================
app.post('/api/auth/google', async (req, res) => {
    const { tokenGoogle } = req.body;

    if (!tokenGoogle) {
        return res.status(400).json({ error: 'No se proporcionó el token de Google.' });
    }

    try {
        // 1. Verificar que el token de Google sea real
        const ticket = await client.verifyIdToken({
            idToken: tokenGoogle,
            audience: GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        const email = payload.email;
        const nombre = payload.name;

        console.log(`📧 Intentando autenticar con Google a: ${email}`);

        // 2. Buscar si este email ya existe en la base de datos
        db.query('SELECT * FROM usuarios WHERE email = ?', [email], (err, results) => {
            if (err) {
                console.error('❌ Error en la query de MySQL al buscar usuario de Google:', err);
                return res.status(500).json({ error: 'Error en la base de datos al buscar el usuario.' });
            }

            if (results && results.length > 0) {
                // EL USUARIO YA EXISTE -> Login directo
                const usuario = results[0];
                const tokenJWT = jwt.sign({ id: usuario.id, rol: usuario.rol }, JWT_SECRET, { expiresIn: '24h' });
                
                console.log(`✅ Usuario existente logueado con Google: ${email}`);
                return res.status(200).json({
                    mensaje: 'Login con Google exitoso',
                    token: tokenJWT,
                    usuarioNuevo: false
                });
            } else {
                // EL USUARIO ES NUEVO -> Avisamos al Frontend
                console.log(`🙋‍♂️ Usuario nuevo detectado desde Google: ${email}`);
                return res.status(200).json({
                    mensaje: 'Se requieren datos adicionales',
                    usuarioNuevo: true,
                    datosGoogle: { nombre, email }
                });
            }
        });

    } catch (error) {
        console.error("❌ Error crítico validando el token de Google en el Backend:", error);
        return res.status(401).json({ error: 'El token de Google es inválido, expiró o el ID de cliente no coincide.' });
    }
});

// ==========================================
// Ruta para obtener todos los turnos de la tabla equipo
// ==========================================
app.get('/api/equipo', (req, res) => {
  const query = 'SELECT * FROM equipo ORDER BY equipo_dato ASC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar la tabla equipo:', err);
      return res.status(500).json({ error: 'Error del servidor al consultar los turnos.' });
    }
    res.json(results); // Envía las filas con columnas en español directamente
  });
});

// ==========================================
// 1. MEDIADOR DE SEGURIDAD (Middleware) para verificar el Token JWT
// ==========================================
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No se proporcionó un token de acceso.' });
  }

  const tokenLimpio = token.startsWith('Bearer ') ? token.slice(7) : token;

jwt.verify(tokenLimpio, JWT_SECRET, (err, decoded) => { 
  if (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
  req.usuarioId = decoded.id; 
  next();
});
};
// ==========================================
// 1.5 MEDIADOR (Middleware) para verificar Rol de Administrador
// ==========================================
const verificarAdmin = (req, res, next) => {
  const query = 'SELECT rol FROM usuarios WHERE id = ?';
  db.query(query, [req.usuarioId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(500).json({ error: 'Error verificando permisos.' });
    }
    
    if (results[0].rol !== 'admin') {
      return res.status(403).json({ error: 'Acceso Denegado: Se requieren privilegios de Administrador.' });
    }
    
    next(); // Si es admin, lo deja pasar a la ruta
  });
};

// ==========================================
// RUTA EXCLUSIVA ADMIN: TRAER TODAS LAS VENTAS
// ==========================================
// Usamos dos middlewares: primero miramos el Token, y después miramos que sea Admin
app.get('/api/admin/ventas', verificarToken, verificarAdmin, (req, res) => {
  const query = `
    SELECT v.id, DATE_FORMAT(v.fecha, '%d/%m/%Y %H:%i') AS fecha, v.total, v.tipo_venta, v.estado_envio, u.nombre AS cliente_nombre
    FROM ventas v
    LEFT JOIN usuarios u ON v.id_usuario = u.id
    ORDER BY v.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar ventas globales:', err);
      return res.status(500).json({ error: 'Error del servidor al buscar auditoría.' });
    }
    res.json(results);
  });
});
// ==========================================
// 2. RUTA DEL PERFIL: Trae los datos reales del usuario logueado usando su ID
// ==========================================
app.get('/api/perfil', verificarToken, (req, res) => {
  // Buscamos en tu tabla 'usuarios' usando el ID que sacamos del Token
  const query = 'SELECT nombre, email, telefono, direccion, rol FROM usuarios WHERE id = ?';

  db.query(query, [req.usuarioId], (err, result) => {
    if (err) {
      console.error('Error al consultar el perfil:', err);
      return res.status(500).json({ error: 'Error del servidor al buscar el perfil.' });
    }

    if (result.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado.' });
    }

    // Le devolvemos al frontend la fila real encontrada
    res.json(result[0]);
  });
});
// ==========================================
// RUTA PARA ACTUALIZAR LOS DATOS DEL PERFIL (DÍA 8 - EXTENSIÓN)
// ==========================================
app.put('/api/perfil', verificarToken, (req, res) => {
  const { nombre, telefono, direccion } = req.body;

  if (!nombre || !telefono || !direccion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios para actualizar.' });
  }

  // Ejecutamos el UPDATE usando el ID del usuario extraído de forma segura del Token
  const query = 'UPDATE usuarios SET nombre = ?, telefono = ?, direccion = ? WHERE id = ?';

  db.query(query, [nombre, telefono, direccion, req.usuarioId], (err, result) => {
    if (err) {
      console.error('Error al actualizar el perfil en MySQL:', err);
      return res.status(500).json({ error: 'Error del servidor al actualizar los datos.' });
    }

    res.json({ message: '¡Datos actualizados con éxito!' });
  });
});
// ==========================================
// RUTA HISTORIAL DE VENTAS REALES (CON DETALLE DE PRODUCTOS)
// ==========================================
app.get('/api/historial', verificarToken, (req, res) => {
  const query = `
    SELECT v.id, DATE_FORMAT(v.fecha, '%d/%m/%Y') AS fecha, v.total, v.estado_envio, v.tipo_venta,
           GROUP_CONCAT(CONCAT(p.nombre, ' (x', dv.cantidad, ')') SEPARATOR ', ') AS detalle_productos
    FROM ventas v
    LEFT JOIN detalle_venta dv ON v.id = dv.id_venta
    LEFT JOIN productos p ON dv.id_producto = p.id
    WHERE v.id_usuario = ? 
    GROUP BY v.id
    ORDER BY v.id DESC
  `;

  db.query(query, [req.usuarioId], (err, results) => {
    if (err) {
      console.error('Error al consultar el historial de ventas:', err);
      return res.status(500).json({ error: 'Error del servidor al buscar el historial.' });
    }
    res.json(results);
  });
});
// ==========================================
// NUEVA RUTA: PROCESAR PAGO WEB (Y DESCUENTO DE STOCK)
// ===================================================================================
app.post('/api/ventas/pagar', verificarToken, (req, res) => {
  const { total, tipo_venta, metodo_entrega, direccion_envio, medio_pago, productosComprados } = req.body;

  if (!total || !productosComprados || !Array.isArray(productosComprados)) {
    return res.status(400).json({ error: 'Faltan datos obligatorios o el carrito está vacío.' });
  }

  let estado_envio = 'Pendiente de pago';
  if (medio_pago === 'Tarjeta') estado_envio = metodo_entrega === 'Retiro en sucursal' ? 'Listo para retirar' : 'Preparando envío';
  else if (medio_pago === 'Transferencia') estado_envio = 'Esperando comprobante';
  else estado_envio = 'A coordinar en sucursal';

  const resumenCortoVenta = `Web - ${medio_pago} - ${metodo_entrega}`;
  const queryVenta = `INSERT INTO ventas (id_usuario, fecha, total, tipo_venta, estado_envio) VALUES (?, NOW(), ?, ?, ?)`;

  db.query(queryVenta, [req.usuarioId, total, resumenCortoVenta, estado_envio], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error del servidor al procesar el pago.' });

    const idVentaGenerada = result.insertId;
    let erroresOcurridos = false;
    let queriesCompletadas = 0;
    const totalQueriesAEjecutar = productosComprados.length * 2; 

    if (productosComprados.length === 0) return res.status(201).json({ message: '¡Pago procesado!', id_venta: idVentaGenerada });

    productosComprados.forEach((item) => {
      // CORRECCIÓN CRÍTICA: Aseguramos capturar el ID correcto que manda React
      const idProd = item.id || item.id_producto; 
      const nombreProd = item.nombre || 'Artículo de Catálogo';
      const colorSeleccionado = item.color || 'Único';
      const rodadoTallaSeleccionado = item.rodado_talla || 'Único';
      const cantidadComprada = item.cantidad || 1;
      const precioUnitario = item.precio || 0;

      // 1. Insertar detalle
      const queryDetalle = `INSERT INTO detalle_venta (id_venta, id_producto, color, rodado_talla, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?, ?)`;
      db.query(queryDetalle, [idVentaGenerada, idProd, colorSeleccionado, rodadoTallaSeleccionado, cantidadComprada, precioUnitario], (errDet) => {
        if (errDet) erroresOcurridos = true;
        verificarFinalizacion();
      });

      // 2. Restar stock y verificar si quedó en CERO
      const queryStock = `UPDATE producto_variantes SET stock = stock - ? WHERE id_producto = ? AND color = ? AND rodado_talla = ?`;
      db.query(queryStock, [cantidadComprada, idProd, colorSeleccionado, rodadoTallaSeleccionado], (errStock) => {
        if (errStock) {
          erroresOcurridos = true;
          verificarFinalizacion();
        } else {
          db.query(`SELECT stock FROM producto_variantes WHERE id_producto = ? AND color = ? AND rodado_talla = ?`, 
          [idProd, colorSeleccionado, rodadoTallaSeleccionado], (errSel, resSel) => {
            // SI EL STOCK LLEGÓ A CERO, DISPARAMOS LA ALERTA
            if (resSel && resSel.length > 0 && resSel[0].stock <= 0) {
              const msgStock = `⚠️ ALERTA STOCK: "${nombreProd}" (${colorSeleccionado} / ${rodadoTallaSeleccionado}) se quedó sin inventario.`;
              db.query('INSERT INTO notificaciones_admin (mensaje, tipo) VALUES (?, "alerta_stock")', [msgStock]);
            }
            verificarFinalizacion();
          });
        }
      });
    });

    function verificarFinalizacion() {
      queriesCompletadas++;
      if (queriesCompletadas === totalQueriesAEjecutar) {
        
        // --- LÓGICA DE NOTIFICACIONES ---
        const queryCliente = "SELECT email, nombre, telefono FROM usuarios WHERE id = ?";
        db.query(queryCliente, [req.usuarioId], (err, rows) => {
          if (!err && rows.length > 0) {
            const { email, nombre, telefono } = rows[0];
            
            const asunto = '¡Gracias por tu compra en Metola Bikes!';
            const cuerpo = `<h1>¡Hola ${nombre}!</h1><p>Tu compra #${idVentaGenerada} ha sido procesada.</p><p>Total: $${total}</p>`;
            enviarCorreo(email, asunto, cuerpo);

            
            const listadoProductos = productosComprados.map(p => `${p.cantidad || 1}x ${p.nombre || 'Artículo de Catálogo'}`).join(', ');
            const alertaMsg = `Venta Web #${idVentaGenerada} | Cliente: ${nombre} | Tel: ${telefono || 'S/N'} | Compró: ${listadoProductos} | Total: $${total}`;
            db.query('INSERT INTO notificaciones_admin (mensaje, tipo) VALUES (?, "venta_web")', [alertaMsg]);
            // NOTIFICACIÓN IN-APP PARA EL CLIENTE: COMPRA REALIZADA
            const msjClienteCompra = `✔ Tu compra fue procesada con éxito. Estamos preparando tu pedido.`;
            db.query('INSERT INTO notificaciones_cliente (id_usuario, mensaje, tipo) VALUES (?, ?, "venta_web")', [req.usuarioId, msjClienteCompra]);
          }
        });

        if (erroresOcurridos) return res.status(201).json({ message: 'Pago con desajustes.', id_venta: idVentaGenerada });
        return res.status(201).json({ message: '¡Pago procesado con éxito!', id_venta: idVentaGenerada });
      }
    }
  });
});

// ==========================================
// REGISTRAR LAS VENTAS PRESENCIAL (EMPLEADO - POS)
// ==========================================
app.post('/api/ventas/presencial', verificarToken, (req, res) => {
  const { total, tipo_venta, medio_pago, productosComprados } = req.body;

  if (!total || !productosComprados || !Array.isArray(productosComprados)) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para facturar.' });
  }

  const estado_envio = 'Entregado en salón';
  const resumenCortoVenta = `Mostrador - ${medio_pago || 'Efectivo'}`;

  const queryVenta = `INSERT INTO ventas (id_usuario, fecha, total, tipo_venta, estado_envio) VALUES (?, NOW(), ?, ?, ?)`;

  db.query(queryVenta, [req.usuarioId, total, resumenCortoVenta, estado_envio], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al registrar la venta presencial.' });

    const idVentaGenerada = result.insertId;
    let erroresOcurridos = false;
    let queriesCompletadas = 0;
    const totalQueriesAEjecutar = productosComprados.length * 2;

    if (productosComprados.length === 0) return res.status(201).json({ message: 'Venta registrada vacía.', id_venta: idVentaGenerada });

    productosComprados.forEach((item) => {
      // CORRECCIÓN CRÍTICA AQUÍ TAMBIÉN
      const idProd = item.id || item.id_producto; 
      const nombreProd = item.nombre || 'Artículo de Catálogo';
      const colorSeleccionado = item.color || 'Único';
      const rodadoTallaSeleccionado = item.rodado_talla || 'Único';
      const cantidadComprada = item.cantidad || 1;
      const precioUnitario = item.precio || 0;

      // 1. Insertamos en detalle_venta
      const queryDetalle = `INSERT INTO detalle_venta (id_venta, id_producto, color, rodado_talla, cantidad, precio_unitario) VALUES (?, ?, ?, ?, ?, ?)`;
      db.query(queryDetalle, [idVentaGenerada, idProd, colorSeleccionado, rodadoTallaSeleccionado, cantidadComprada, precioUnitario], (errDet) => {
        if (errDet) erroresOcurridos = true;
        verificarFinalizacion();
      });

      // 2. Descontamos el stock de la variante y verificamos si quedó en CERO
      const queryStock = `UPDATE producto_variantes SET stock = stock - ? WHERE id_producto = ? AND color = ? AND rodado_talla = ?`;
      db.query(queryStock, [cantidadComprada, idProd, colorSeleccionado, rodadoTallaSeleccionado], (errStock) => {
        if (errStock) {
          erroresOcurridos = true;
          verificarFinalizacion();
        } else {
          db.query(`SELECT stock FROM producto_variantes WHERE id_producto = ? AND color = ? AND rodado_talla = ?`, 
          [idProd, colorSeleccionado, rodadoTallaSeleccionado], (errSel, resSel) => {
            // ALERTA DE STOCK PARA MOSTRADOR
            if (resSel && resSel.length > 0 && resSel[0].stock <= 0) {
              const msgStock = `⚠️ ALERTA STOCK: "${nombreProd}" (${colorSeleccionado} / ${rodadoTallaSeleccionado}) se quedó sin inventario en el salón.`;
              db.query('INSERT INTO notificaciones_admin (mensaje, tipo) VALUES (?, "alerta_stock")', [msgStock]);
            }
            verificarFinalizacion();
          });
        }
      });
    });

    function verificarFinalizacion() {
      queriesCompletadas++;
      if (queriesCompletadas === totalQueriesAEjecutar) {
        if (erroresOcurridos) return res.status(201).json({ message: 'Venta registrada con desajustes de stock.', id_venta: idVentaGenerada });
        return res.status(201).json({ message: '¡Venta presencial facturada con éxito!', id_venta: idVentaGenerada });
      }
    }
  });
});
// ===================================================================================
// RUTA INVENTARIO: CREAR PRODUCTO (AHORA CON MULTER PARA IMÁGENES)
// ===================================================================================
app.post('/api/productos', verificarToken, upload.array('imagenes', 5), (req, res) => {
  // Agregamos descuento y destacado al destructuring
  const { nombre, descripcion, precio, stock, id_categoria, descuento, destacado } = req.body;
  
  let variantes = [];
  if (req.body.variantes) {
    variantes = JSON.parse(req.body.variantes);
  }

  if (!nombre || !precio) {
    return res.status(400).json({ error: 'El nombre y el precio del insumo son obligatorios.' });
  }

  let imagenPath = '🚲';
  if (req.files && req.files.length > 0) {
    imagenPath = req.files.map(file => 'http://localhost:5000/uploads/' + file.filename).join('|');
  }

  // Actualizamos el INSERT para que incluya las nuevas columnas
  const queryProducto = `
    INSERT INTO productos (nombre, descripcion, precio, stock, imagen, id_categoria, descuento, destacado) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Parseamos a número y booleano por seguridad
  const valDescuento = Number(descuento) || 0;
  const valDestacado = destacado === 'true' || destacado === true ? 1 : 0;

  db.query(queryProducto, [nombre, descripcion, precio, stock || 0, imagenPath, id_categoria || 1, valDescuento, valDestacado], (err, result) => {
    if (err) {
      console.error('Error insertando producto general:', err);
      return res.status(500).json({ error: 'Error del servidor al registrar el producto.' });
    }

    const idProductoInsertado = result.insertId;

    if (variantes && Array.isArray(variantes) && variantes.length > 0) {
      let variantesGuardadas = 0;
      let huboErrorVariante = false;

      variantes.forEach((v) => {
        const queryVariante = `INSERT INTO producto_variantes (id_producto, color, rodado_talla, stock) VALUES (?, ?, ?, ?)`;
        db.query(queryVariante, [idProductoInsertado, v.color || 'Único', v.size || 'Único', Number(v.stock || 0)], (errVar) => {
          if (errVar) huboErrorVariante = true;
          variantesGuardadas++;
          if (variantesGuardadas === variantes.length) {
            if (huboErrorVariante) return res.status(201).json({ message: 'Producto guardado, pero algunas variantes fallaron.' });
            return res.status(201).json({ message: '¡Producto y variantes guardados con éxito!' });
          }
        });
      });
    } else {
      const queryVarianteDefault = `INSERT INTO producto_variantes (id_producto, color, rodado_talla, stock) VALUES (?, 'Único', 'Único', ?)`;
      db.query(queryVarianteDefault, [idProductoInsertado, stock || 0], () => {
        return res.status(201).json({ message: 'Producto simple guardado en inventario con éxito.' });
      });
    }
  });
});

// ==========================================================
// RUTA PARA EDITAR/ACTUALIZAR UN PRODUCTO Y SUS VARIANTES
// ==========================================================
app.put('/api/productos/:id', verificarToken, upload.array('imagenes', 5), (req, res) => {
  const { id } = req.params;
  // Agregamos descuento y destacado
  const { nombre, descripcion, precio, stock, id_categoria, imagen_existente, descuento, destacado } = req.body;
  
  let variantes = [];
  if (req.body.variantes) {
    variantes = JSON.parse(req.body.variantes);
  }

  let imagenPath = imagen_existente || '🚲';
  if (req.files && req.files.length > 0) {
    imagenPath = req.files.map(file => 'http://localhost:5000/uploads/' + file.filename).join('|');
  }

  const valDescuento = Number(descuento) || 0;
  const valDestacado = destacado === 'true' || destacado === true ? 1 : 0;

  // Actualizamos el UPDATE
  const queryUpdate = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ?, id_categoria = ?, descuento = ?, destacado = ? WHERE id = ?';
  
  db.query(queryUpdate, [nombre, descripcion, precio, stock, imagenPath, id_categoria, valDescuento, valDestacado, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar producto.' });

    db.query('DELETE FROM producto_variantes WHERE id_producto = ?', [id], (errDel) => {
      if (errDel) return res.status(500).json({ error: 'Error limpiando variantes antiguas.' });

      if (variantes && variantes.length > 0) {
        const values = variantes.map(v => [id, v.color, v.size, v.stock]);
        const queryInsertVar = 'INSERT INTO producto_variantes (id_producto, color, rodado_talla, stock) VALUES ?';

        db.query(queryInsertVar, [values], (errIns) => {
          if (errIns) return res.status(500).json({ error: 'Error guardando stock físico.' });
          res.json({ message: '¡Producto y variantes actualizados con éxito!' });
        });
      } else {
        res.json({ message: '¡Producto actualizado con éxito!' });
      }
    });
  });
});

// ==========================================
// RUTA INVENTARIO: ELIMINAR PRODUCTO (BORRADO LÓGICO / SOFT DELETE)
// ==========================================
app.delete('/api/productos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  
  // En vez de usar DELETE FROM, usamos UPDATE para cambiar el estado
  const query = "UPDATE productos SET estado = 'inactivo' WHERE id = ?";
  
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al dar de baja el producto:', err);
      return res.status(500).json({ error: 'Error del servidor al desactivar el producto.' });
    }
    res.json({ message: 'Producto dado de baja (oculto del catálogo) correctamente.' });
  });
});
// ==========================================
// RUTA INVENTARIO (ADMIN/EMPLEADO): TRAER ABSOLUTAMENTE TODOS LOS PRODUCTOS
// ==========================================
app.get('/api/admin/productos', verificarToken, (req, res) => {
  const queryProductos = `
    SELECT p.*, IFNULL(SUM(v.stock), 0) AS stock
    FROM productos p
    LEFT JOIN producto_variantes v ON p.id = v.id_producto
    GROUP BY p.id
  `;

  db.query(queryProductos, (err, products) => {
    if (err) return res.status(500).json({ error: 'Error obteniendo productos para inventario' });
    
    db.query('SELECT * FROM producto_variantes', (err, variants) => {
      if (err) return res.status(500).json({ error: 'Error obteniendo variantes' });
      const productsWithVariants = products.map(p => {
        const pVariants = variants.filter(v => v.id_producto === p.id);
        return { ...p, variantes: pVariants };
      });
      res.json(productsWithVariants);
    });
  });
});
// ==========================================================
// TALLER: CONFIGURACIÓN GLOBAL DE DISPONIBILIDAD (NUEVO)
// ==========================================================

// 1. Obtener el estado actual del taller (Público)
app.get('/api/equipo/config', (req, res) => {
  db.query('SELECT * FROM taller_config WHERE id = 1', (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al consultar configuración del taller.' });
    res.json(result[0] || { taller_habilitado: 1, mensaje_estado: '' });
  });
});

// 2. Modificar el estado del taller (Exclusivo Admin/Empleado)
app.put('/api/admin/equipo/config', verificarToken, (req, res) => {
  const { taller_habilitado, mensaje_estado } = req.body;
  const valHabilitado = taller_habilitado ? 1 : 0;

  const query = 'UPDATE taller_config SET taller_habilitado = ?, mensaje_estado = ? WHERE id = 1';
  db.query(query, [valHabilitado, mensaje_estado || ''], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar configuración.' });
    res.json({ message: 'La disponibilidad del taller ha sido actualizada con éxito.' });
  });
});

// ==========================================================
// TALLER: CREAR NUEVA SOLICITUD PROTEGIDA (CLIENTE) - CON FILTRO DE PAUSA
// ==========================================================
app.post('/api/equipo', verificarToken, (req, res) => {
  const { bici_modelo, equipo_dato, descripcion } = req.body;

  if (!bici_modelo || !equipo_dato || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  // VALIDACIÓN DE SEGURIDAD INTERNA: Verificamos si el taller acepta solicitudes web
  db.query('SELECT taller_habilitado FROM taller_config WHERE id = 1', (errConfig, configRes) => {
    if (errConfig) return res.status(500).json({ error: 'Error interno de validación.' });
    
    if (configRes[0] && configRes[0].taller_habilitado === 0) {
      return res.status(400).json({ error: 'La recepción de turnos web se encuentra suspendida temporalmente por alta demanda.' });
    }

    const query = `
      INSERT INTO equipo (bici_modelo, equipo_dato, descripcion, estado, creacion) 
      VALUES (?, ?, ?, 'Pendiente', ?)
    `;

    db.query(query, [bici_modelo, equipo_dato, descripcion, req.usuarioId], (err, result) => {
      if (err) {
        console.error('Error al insertar en la tabla equipo:', err);
        return res.status(500).json({ error: 'Error del servidor al guardar el turno.' });
      }
      //Insertar alerta interna para el Mecánico
    const alertaTallerMsg = `Nueva solicitud de turno web para el componente/bici: ${bici_modelo}.`;
    db.query('INSERT INTO notificaciones_admin (mensaje, tipo) VALUES (?, "taller")', [alertaTallerMsg]);
      res.status(201).json({ message: '¡Turno solicitado con éxito!', id: result.insertId });
    });
  });
});

// ==========================================================
// TALLER: VER MIS SOLICITUDES (CLIENTE) - CON FECHA FORMATEADA
// ==========================================================
app.get('/api/equipo/mis-turnos', verificarToken, (req, res) => {
  const query = `
    SELECT id, bici_modelo, DATE_FORMAT(equipo_dato, '%Y-%m-%d %H:%i') AS equipo_dato, descripcion, estado, motivo_rechazo 
    FROM equipo 
    WHERE creacion = ? 
    ORDER BY id DESC
  `;

  db.query(query, [req.usuarioId], (err, results) => {
    if (err) {
      console.error('Error al consultar turnos del cliente:', err);
      return res.status(500).json({ error: 'Error al buscar tus solicitudes.' });
    }
    res.json(results);
  });
});

// ==========================================================
// TALLER: TRAER HORAS OCUPADAS POR FECHA (CLIENTE) - CON FECHA FORMATEADA
// ==========================================================
app.get('/api/equipo/ocupados', verificarToken, (req, res) => {
  const { date } = req.query; 

  if (!date) {
    return res.status(400).json({ error: 'Falta especificar la fecha de consulta.' });
  }

  // Formateamos equipo_dato en la consulta para asegurar el string correcto
  // Trae los turnos ocupados, ignorando los Rechazados y los Cancelados para que se libere la hora
  const query = `
    SELECT DATE_FORMAT(equipo_dato, '%Y-%m-%d %H:%i') AS equipo_dato
    FROM equipo 
    WHERE equipo_dato LIKE ? 
      AND (estado IS NULL OR (estado != 'Rechazado' AND estado != 'Cancelado'))
  `;

  db.query(query, [`${date}%`], (err, results) => {
    if (err) {
      console.error('Error al verificar horarios ocupados:', err);
      return res.status(500).json({ error: 'Error del servidor al consultar disponibilidad.' });
    }

    const takenHours = results.map(row => {
      if (!row.equipo_dato) return '';
      
      const dataStr = String(row.equipo_dato); 
      const parts = dataStr.split(' '); // Ahora sí va a encontrar el espacio en blanco
      
      return parts[1] ? parts[1].substring(0, 5) : dataStr.substring(0, 5);
    }).filter(Boolean);

    res.json(takenHours);
  });
});

// ==========================================================
// TALLER: OBTENER TODOS LOS TURNOS CON DATOS DEL CLIENTE (EMPLEADO) - CON FECHA FORMATEADA
// ==========================================================
app.get('/api/admin/equipo', verificarToken, (req, res) => {
  const query = `
    SELECT 
      e.id, 
      e.bici_modelo, 
      DATE_FORMAT(e.equipo_dato, '%Y-%m-%d %H:%i') AS equipo_dato, 
      e.descripcion, 
      e.estado, 
      e.motivo_rechazo,
      u.nombre AS cliente_nombre,
      u.telefono AS cliente_telefono
    FROM equipo e
    INNER JOIN usuarios u ON e.creacion = u.id
    GROUP BY e.id
    ORDER BY e.equipo_dato ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar tabla equipo con join agrupado:', err);
      return res.status(500).json({ error: 'Error del servidor al consultar los turnos.' });
    }
    res.json(results);
  });
});

// ==========================================================
// TALLER: ACTUALIZAR ESTADO / RECHAZAR CON MOTIVO (EMPLEADO)
// ==========================================================
app.put('/api/admin/equipo/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { estado, motivo_rechazo } = req.body; 

  const query = 'UPDATE equipo SET estado = ?, motivo_rechazo = ? WHERE id = ?';

  db.query(query, [estado, motivo_rechazo || null, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar estado del turno:', err);
      return res.status(500).json({ error: 'Error del servidor al modificar el estado.' });
    }

    // --- LÓGICA DE NOTIFICACIÓN POR EMAIL (AMPLIADA) ---
    // Ahora escucha tanto cuando se acepta el turno, como cuando se termina el trabajo
    if (estado === 'Aceptado' || estado === 'Listo para retirar' || estado === 'Completado') {
      
      const queryEmail = `
        SELECT u.id AS id_cliente, u.email, u.nombre, e.bici_modelo, DATE_FORMAT(e.equipo_dato, '%d/%m/%Y %H:%i') AS equipo_dato 
        FROM equipo e 
        JOIN usuarios u ON e.creacion = u.id 
        WHERE e.id = ?`;
        
      db.query(queryEmail, [id], (err, rows) => {
        if (!err && rows.length > 0) {
          const { id_cliente, email, nombre, bici_modelo, equipo_dato } = rows[0];
          
          let asunto = '';
          let cuerpo = '';
          let msjNotificacionWeb = ''; // <--- Nueva variable para la campanita

          // Mensaje si el turno es ACEPTADO
          if (estado === 'Aceptado') {
            asunto = '¡Tu turno en Metola Bikes ha sido confirmado!';
            msjNotificacionWeb = `✔ Tu turno para ${bici_modelo} fue confirmado para el día ${equipo_dato}.`;
            cuerpo = `
              <h1>¡Hola ${nombre}!</h1>
              <p>Te traemos buenas noticias: tu solicitud de turno para <b>${bici_modelo}</b> ha sido aceptada.</p>
              <p>Te esperamos el día: <b>${equipo_dato}</b> en nuestro taller.</p>
              <p>Gracias por confiar en Metola Bikes.</p>
            `;
          } 
          // Mensaje si el trabajo está LISTO PARA RETIRAR
          else {
            asunto = '🚲 ¡Tu bicicleta ya está lista!';
            msjNotificacionWeb = `✔ El servicio para tu ${bici_modelo} finalizó. ¡Ya podés pasar a retirarla!`;
            cuerpo = `
              <h1>¡Hola ${nombre}!</h1>
              <p>Te avisamos que el servicio técnico para tu <b>${bici_modelo}</b> ha finalizado con éxito.</p>
              <p>Ya podés pasar por nuestra sucursal a retirarla cuando gustes.</p>
              <p>¡Gracias por elegir a Metola Bikes!</p>
            `;
          }

          // 1. Enviar el correo
          enviarCorreo(email, asunto, cuerpo);

          // 2. Insertar notificación web para el cliente
          db.query(
            'INSERT INTO notificaciones_cliente (id_usuario, mensaje, tipo) VALUES (?, ?, "taller")',
            [id_cliente, msjNotificacionWeb]
          );
        }
      });
    }

    res.json({ message: estado === 'Rechazado' ? 'Turno rechazado con motivo registrado.' : `Turno actualizado a: ${estado}` });
  });
});
// ==========================================================
// TALLER: CANCELAR TURNO (CLIENTE)
// ==========================================================
app.put('/api/equipo/cancelar/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  // Actualiza el estado a Cancelado siempre y cuando pertenezca al cliente logueado (creacion)
  const query = 'UPDATE equipo SET estado = "Cancelado" WHERE id = ? AND creacion = ?';

  db.query(query, [id, req.usuarioId], (err, result) => {
    if (err) {
      console.error('Error al cancelar el turno:', err);
      return res.status(500).json({ error: 'Error del servidor al procesar la cancelación.' });
    }
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Turno no encontrado o no autorizado.' });
    }

    res.json({ message: 'El turno ha sido cancelado con éxito.' });
  });
});

// ==========================================================
// TALLER: ELIMINAR SOLICITUD COMPLETADA/VIEJA (EMPLEADO)
// ==========================================================
app.delete('/api/admin/equipo/:id', verificarToken, (req, res) => {
  const { id } = req.params;

  // Eliminación física definitiva de la tabla equipo
  const query = 'DELETE FROM equipo WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar turno en el administrador:', err);
      return res.status(500).json({ error: 'Error del servidor al eliminar la solicitud.' });
    }

    res.json({ message: 'Solicitud eliminada correctamente del registro histórico.' });
  });
});
// ==========================================================
// MÓDULO EMPLEADO/ADMIN: GESTIÓN DE PEDIDOS WEB (LOGÍSTICA)
// ==========================================================
// 1. Traer todos los pedidos online con detalle de productos y cliente
app.get('/api/pedidos', verificarToken, (req, res) => {
  const query = `
    SELECT v.id, DATE_FORMAT(v.fecha, '%d/%m/%Y %H:%i') AS fecha, v.total, v.estado_envio, v.tipo_venta,
           u.nombre AS cliente_nombre, u.telefono AS cliente_telefono, u.direccion AS cliente_direccion,
           GROUP_CONCAT(CONCAT(p.nombre, ' (', IFNULL(dv.color, 'Único'), ' / ', IFNULL(dv.rodado_talla, 'Único'), ') x', dv.cantidad) SEPARATOR ' | ') AS detalle_productos
    FROM ventas v
    LEFT JOIN detalle_venta dv ON v.id = dv.id_venta
    LEFT JOIN productos p ON dv.id_producto = p.id
    LEFT JOIN usuarios u ON v.id_usuario = u.id
    WHERE v.tipo_venta LIKE '%Web%'
    GROUP BY v.id
    ORDER BY v.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al consultar pedidos:', err);
      return res.status(500).json({ error: 'Error del servidor al buscar los pedidos.' });
    }
    res.json(results);
  });
});

// 2. Actualizar el estado logístico de un pedido y notificar al cliente
app.put('/api/pedidos/:id/estado', verificarToken, (req, res) => {
  const { id } = req.params;
  const { estado_envio } = req.body;

  const query = 'UPDATE ventas SET estado_envio = ? WHERE id = ?';

  db.query(query, [estado_envio, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar estado del pedido:', err);
      return res.status(500).json({ error: 'Error del servidor al actualizar el pedido.' });
    }

    //LÓGICA DE NOTIFICACIONES DE LOGÍSTICA PARA EL CLIENTE
    // Buscamos a qué cliente le pertenece esta venta
    db.query('SELECT id_usuario FROM ventas WHERE id = ?', [id], (errUsuario, rows) => {
      if (!errUsuario && rows.length > 0) {
        const id_cliente = rows[0].id_usuario;
        let msjLogistica = '';

        // Definimos el mensaje según el estado que eligió el empleado
        if (estado_envio === 'Despachado') {
          msjLogistica = `¡Buenas noticias!  ✔ Tu pedido ya fue despachado y está en camino.`;
        } else if (estado_envio === 'Listo para retirar') {
          msjLogistica = ` ✔ Tu pedido ya está empaquetado y listo. ¡Te esperamos en la sucursal!`;
        }

        // Si hay un mensaje para ese estado, guardamos la notificación
        if (msjLogistica !== '') {
          db.query('INSERT INTO notificaciones_cliente (id_usuario, mensaje, tipo) VALUES (?, ?, "venta_web")', [id_cliente, msjLogistica]);
        }
      }
    });

    res.json({ message: 'Estado del paquete actualizado con éxito.' });
  });
});
// ==========================================================
// MÓDULO ADMINISTRADOR: ANALÍTICA Y ESTADÍSTICAS (BI)
// ==========================================================
app.get('/api/admin/estadisticas', verificarToken, verificarAdmin, (req, res) => {
  // 1. Ingresos Mensuales del año actual divididos por canal (Web vs Mostrador)
  const queryMensual = `
    SELECT 
      DATE_FORMAT(fecha, '%M') AS mes_nombre,
      MONTH(fecha) AS mes_num,
      SUM(CASE WHEN tipo_venta LIKE '%Web%' THEN total ELSE 0 END) AS ingresos_web,
      SUM(CASE WHEN tipo_venta LIKE '%Mostrador%' THEN total ELSE 0 END) AS ingresos_mostrador
    FROM ventas
    WHERE YEAR(fecha) = YEAR(NOW())
    GROUP BY MONTH(fecha), DATE_FORMAT(fecha, '%M')
    ORDER BY mes_num ASC
  `;

  // 2. Top 5 Productos más vendidos con su desglose de cantidades
  const queryTopProductos = `
    SELECT p.nombre, SUM(dv.cantidad) AS total_vendido
    FROM detalle_venta dv
    INNER JOIN productos p ON dv.id_producto = p.id
    GROUP BY p.id
    ORDER BY total_vendido DESC
    LIMIT 5
  `;

  // 3. Distribución de Medios de Pago más utilizados
  const queryMediosPago = `
    SELECT 
      CASE 
        WHEN tipo_venta LIKE '%Efectivo%' THEN 'Efectivo'
        WHEN tipo_venta LIKE '%Tarjeta%' THEN 'Tarjeta'
        WHEN tipo_venta LIKE '%Transferencia%' THEN 'Transferencia / MP'
        ELSE 'Otros'
      END AS medio,
      COUNT(*) AS cantidad_usos
    FROM ventas
    GROUP BY medio
  `;

  // Ejecutamos las consultas en cascada para devolver un solo objeto consolidado
  db.query(queryMensual, (err, mensual) => {
    if (err) return res.status(500).json({ error: 'Error en analítica mensual.' });

    db.query(queryTopProductos, (errTop, productos) => {
      if (errTop) return res.status(500).json({ error: 'Error en analítica de productos.' });

      db.query(queryMediosPago, (errPago, pagos) => {
        if (errPago) return res.status(500).json({ error: 'Error en analítica de pagos.' });

        // Mapeamos los nombres de los meses al español para que el gráfico quede impecable
        const mesesEsp = {
          January: 'Ene', February: 'Feb', March: 'Mar', April: 'Abr', May: 'May', June: 'Jun',
          July: 'Jul', August: 'Ago', September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dic'
        };

        const datosMensualesFormateados = mensual.map(row => ({
          mes: mesesEsp[row.mes_nombre] || row.mes_nombre,
          Web: Number(row.ingresos_web),
          Mostrador: Number(row.ingresos_mostrador),
          Total: Number(row.ingresos_web) + Number(row.ingresos_mostrador)
        }));

        res.json({
          ingresosMensuales: datosMensualesFormateados,
          topProductos: productos.map(p => ({ name: p.nombre, cantidad: Number(p.total_vendido) })),
          mediosPago: pagos.map(p => ({ name: p.medio, value: Number(p.cantidad_usos) }))
        });
      });
    });
  });
});
// ==========================================================
// MÓDULO ADMINISTRADOR: GESTIÓN DE USUARIOS Y ROLES
// ==========================================================
// 1. Obtener la lista de todos los usuarios registrados
app.get('/api/admin/usuarios', verificarToken, verificarAdmin, (req, res) => {
  // Excluimos la contraseña por seguridad
  const query = 'SELECT id, nombre, email, telefono, direccion, rol FROM usuarios ORDER BY id DESC';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener lista de usuarios:', err);
      return res.status(500).json({ error: 'Error del servidor al cargar usuarios.' });
    }
    res.json(results);
  });
});

// 2. Cambiar el rol de un usuario (Ascender/Descender)
app.put('/api/admin/usuarios/:id/rol', verificarToken, verificarAdmin, (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  // Evitar que el admin se quite el rol a sí mismo por accidente
  if (parseInt(id) === req.usuarioId && rol !== 'admin') {
    return res.status(400).json({ error: 'No puedes quitarte el rol de Administrador a ti mismo.' });
  }

  const query = 'UPDATE usuarios SET rol = ? WHERE id = ?';

  db.query(query, [rol, id], (err, result) => {
    if (err) {
      console.error('Error al cambiar rol de usuario:', err);
      return res.status(500).json({ error: 'Error del servidor al actualizar el rol.' });
    }
    res.json({ message: `El usuario ha sido actualizado al rol de: ${rol.toUpperCase()}` });
  });
});
// ==========================================================
// MÓDULO ADMINISTRADOR/EMPLEADO: ENDPOINTS DE ALERTAS UNIFICADAS
// ==========================================================

// 1. Campanita (Sólo no leídas)
app.get('/api/admin/notificaciones', verificarToken, (req, res) => {
  // Ahora TODOS los empleados y admins ven las ventas y la falta de stock
  const query = 'SELECT * FROM notificaciones_admin WHERE leido = FALSE ORDER BY id DESC';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener alertas.' });
    res.json(results);
  });
});

// 2. Historial Completo (Pantalla Dedicada)
app.get('/api/admin/notificaciones/todas', verificarToken, (req, res) => {
  const query = 'SELECT *, DATE_FORMAT(fecha, "%d/%m/%Y %H:%i") AS fecha_formateada FROM notificaciones_admin ORDER BY id DESC LIMIT 100';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener historial.' });
    res.json(results);
  });
});

// 3. Marcar todo como Leído
app.put('/api/admin/notificaciones/leer', verificarToken, (req, res) => {
  const query = 'UPDATE notificaciones_admin SET leido = TRUE WHERE leido = FALSE';
  db.query(query, (err) => {
    if (err) return res.status(500).json({ error: 'Error al limpiar alertas.' });
    res.json({ message: 'Campanita actualizada.' });
  });
});
// ==========================================================
// MÓDULO CLIENTE: NOTIFICACIONES WEB PERSONALES
// ==========================================================

// 1. Traer solo las notificaciones del cliente que está logueado
app.get('/api/notificaciones/mis-avisos', verificarToken, (req, res) => {
  const query = `
    SELECT *, DATE_FORMAT(fecha, '%d/%m/%Y %H:%i') AS fecha_formateada 
    FROM notificaciones_cliente 
    WHERE id_usuario = ? AND leido = FALSE 
    ORDER BY id DESC
  `;
  
  db.query(query, [req.usuarioId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tus avisos.' });
    res.json(results);
  });
});

// 2. Marcar las notificaciones del cliente como leídas
app.put('/api/notificaciones/marcar-leidas', verificarToken, (req, res) => {
  const query = 'UPDATE notificaciones_cliente SET leido = TRUE WHERE id_usuario = ? AND leido = FALSE';
  db.query(query, [req.usuarioId], (err) => {
    if (err) return res.status(500).json({ error: 'Error al limpiar tus avisos.' });
    res.json({ message: 'Avisos marcados como leídos.' });
  });
});
// 3. Traer TODAS las notificaciones del cliente (Historial completo)
app.get('/api/notificaciones/historial-cliente', verificarToken, (req, res) => {
  const query = `
    SELECT *, DATE_FORMAT(fecha, '%d/%m/%Y %H:%i') AS fecha_formateada 
    FROM notificaciones_cliente 
    WHERE id_usuario = ? 
    ORDER BY id DESC
  `;
  
  db.query(query, [req.usuarioId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener tu historial de avisos.' });
    res.json(results);
  });
});

// Configurar el puerto
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
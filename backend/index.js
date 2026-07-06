const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');   
require('dotenv').config();

const app = express();

// Middlewares
// Middlewares con límite de carga ampliado para soportar múltiples imágenes Base64
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors()); 

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',      
    password: '',      
    database: 'bicicleteria_bd' 
});

// Probar la conexión
db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos: ' + err.stack);
        return;
    }
    console.log('✅ Conectado a la base de datos de la Bicicletería Metola Bikes');
});

// Clave secreta para firmar los tokens (Guardala en el .env más adelante)
const JWT_SECRET = 'clave_secreta_para_desarrollo';

// --- RUTAS EXISTENTES ---
app.get('/', (req, res) => {
    res.send('El servidor de la Bicicletería está funcionando!');
});

// ==========================================================
// RUTA CATÁLOGO GENERAL (CON DETALLE DE VARIANTES)
// ==========================================================
app.get('/productos', (req, res) => {
  // Buscamos los productos y su stock total
  const queryProductos = `
    SELECT p.*, IFNULL(SUM(v.stock), 0) AS stock
    FROM productos p
    LEFT JOIN producto_variantes v ON p.id = v.id_producto
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
// --- NUEVA RUTA: DÍA 3 - REGISTRO ---
// ==========================================
app.post('/api/auth/register', (req, res) => {
    const { nombre, email, contrasena, telefono, direccion, rol } = req.body;

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


// 1. MEDIADOR DE SEGURIDAD (Middleware) para verificar el Token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ error: 'No se proporcionó un token de acceso.' });
  }

  // Quitamos la palabra "Bearer " si el frontend la envía
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
// RUTA HISTORIAL DE VENTAS REALES 
// ==========================================
app.get('/api/historial', verificarToken, (req, res) => {
  const query = `
    SELECT id, DATE_FORMAT(fecha, '%d/%m/%Y') AS fecha, total, estado_envio, tipo_venta 
    FROM ventas 
    WHERE id_usuario = ? 
    ORDER BY id DESC
  `;

  db.query(query, [req.usuarioId], (err, results) => {
    if (err) {
      console.error('Error al consultar el historial de ventas:', err);
      return res.status(500).json({ error: 'Error del servidor al buscar el historial.' });
    }

    // Devuelve un array (que puede estar vacío [] si el usuario no tiene compras aún)
    res.json(results);
  });
});
// ==========================================
// NUEVA RUTA: PROCESAR PAGO, DETALLE DE VENTA Y DESCUENTO DE STOCK VARIANTES AUTOMÁTICO
// ===================================================================================
app.post('/api/ventas/pagar', verificarToken, (req, res) => {
  // Ahora el frontend debe enviarnos también el array de productos ('productosComprados') del carrito
  const { total, tipo_venta, metodo_entrega, direccion_envio, medio_pago, productosComprados } = req.body;

  if (!total || !tipo_venta || !productosComprados || !Array.isArray(productosComprados)) {
    return res.status(400).json({ error: 'Faltan datos obligatorios o el carrito está vacío para procesar la venta.' });
  }

  // Definimos el estado inicial del envío según la opción elegida
  let estado_envio = 'Pendiente de pago';
  if (medio_pago === 'Tarjeta') {
    estado_envio = metodo_entrega === 'Retiro en sucursal' ? 'Listo para retirar' : 'Preparando envío';
  } else if (medio_pago === 'Transferencia') {
    estado_envio = 'Esperando comprobante';
  } else {
    estado_envio = 'A coordinar en sucursal';
  }

  const resumenCortoVenta = `Web - ${medio_pago} - ${metodo_entrega}`;

  // 1. Insertamos la Cabecera de la Venta
  const queryVenta = `
    INSERT INTO ventas (id_usuario, fecha, total, tipo_venta, estado_envio) 
    VALUES (?, NOW(), ?, ?, ?)
  `;

  db.query(queryVenta, [req.usuarioId, total, resumenCortoVenta, estado_envio], (err, result) => {
    if (err) {
      console.error('Error crítico al insertar la venta en MySQL:', err);
      return res.status(500).json({ error: 'Error del servidor al procesar el pago.' });
    }

    const idVentaGenerada = result.insertId; // Recuperamos el ID de la venta que se acaba de crear

    // 2. Recorremos con un bucle cada producto del carrito para guardar su detalle y restar stock
    let erroresOcurridos = false;
    let queriesCompletadas = 0;
    const totalQueriesAEjecutar = productosComprados.length * 2; // 1 insert de detalle + 1 update de stock por cada item

    if (productosComprados.length === 0) {
      return res.status(201).json({ message: '¡Pago procesado con éxito!', id_venta: idVentaGenerada });
    }

    productosComprados.forEach((item) => {
      // Mandamos de forma segura valores por defecto por si el producto no tiene variante (ej: un accesorio sin talle)
      const colorSeleccionado = item.color || 'Único';
      const rodadoTallaSeleccionado = item.rodado_talla || 'Único';
      const cantidadComprada = item.cantidad || 1;
      const precioUnitario = item.precio || 0;

      // A) Insertar en la tabla intermedia 'detalle_venta' que creaste en phpMyAdmin
      const queryDetalle = `
        INSERT INTO detalle_venta (id_venta, id_producto, color, rodado_talla, cantidad, precio_unitario)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      db.query(queryDetalle, [idVentaGenerada, item.id_producto, colorSeleccionado, rodadoTallaSeleccionado, cantidadComprada, precioUnitario], (errDet) => {
        if (errDet) {
          console.error('Error al insertar en detalle_venta:', errDet);
          erroresOcurridos = true;
        }
        verificarFinalizacion();
      });

      // B) Restar el stock automatizado específicamente de la variante color/rodado elegida
      const queryStock = `
        UPDATE producto_variantes 
        SET stock = stock - ? 
        WHERE id_producto = ? AND color = ? AND rodado_talla = ?
      `;

      db.query(queryStock, [cantidadComprada, item.id_producto, colorSeleccionado, rodadoTallaSeleccionado], (errStock) => {
        if (errStock) {
          console.error('Error al actualizar el stock de la variante:', errStock);
          erroresOcurridos = true;
        }
        verificarFinalizacion();
      });
    });

    // Función auxiliar para responderle al cliente una vez que terminaron de correr todos los inserts y updates
    function verificarFinalizacion() {
      queriesCompletadas++;
      if (queriesCompletadas === totalQueriesAEjecutar) {
        if (erroresOcurridos) {
          return res.status(201).json({ 
            message: '¡Pago registrado!, pero hubo un desajuste al procesar algunos artículos o su stock.', 
            id_venta: idVentaGenerada 
          });
        }
        return res.status(201).json({ 
          message: '¡Pago procesado con éxito, venta registrada y stock de variantes actualizado!', 
          id_venta: idVentaGenerada 
        });
      }
    }
  });
});
// ==========================================
// REGISTRAR LAS VENTAS PRESENCIAL (EMPLEADO - POS)
// ==========================================
app.post('/api/ventas/presencial', verificarToken, (req, res) => {
  const { total, tipo_venta } = req.body;

  if (!total || !tipo_venta) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para facturar.' });
  }

  // Las ventas de mostrador se entregan en el acto, por lo que el estado es 'Entregado en salón'
  const estado_envio = 'Entregado en salón';

  const query = `
    INSERT INTO ventas (id_usuario, fecha, total, tipo_venta, estado_envio) 
    VALUES (?, NOW(), ?, ?, ?)
  `;

  // req.usuarioId identifica al empleado que está realizando la facturación en la terminal
  db.query(query, [req.usuarioId, total, `Mostrador: ${tipo_venta}`, estado_envio], (err, result) => {
    if (err) {
      console.error('Error al facturar en mostrador:', err);
      return res.status(500).json({ error: 'Error del servidor al registrar la venta presencial.' });
    }

    res.status(201).json({ 
      message: '¡Venta presencial facturada con éxito!', 
      id_venta: result.insertId 
    });
  });
});
// ===================================================================================
// RUTA INVENTARIO: CREAR PRODUCTO GENERAL Y SUS VARIANTES FÍSICAS AUTOMÁTICAMENTE
// ===================================================================================
app.post('/api/productos', verificarToken, (req, res) => {
  const { nombre, descripcion, precio, stock, imagen, id_categoria, variantes } = req.body;

  if (!nombre || !precio) {
    return res.status(400).json({ error: 'El nombre y el precio del insumo son obligatorios.' });
  }

  // 1. Insertamos la información base en la tabla Productos
  const queryProducto = `
    INSERT INTO productos (nombre, descripcion, precio, stock, imagen, id_categoria) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(queryProducto, [nombre, descripcion, precio, stock || 0, imagen || '🚲', id_categoria || 1], (err, result) => {
    if (err) {
      console.error('Error insertando producto general:', err);
      return res.status(500).json({ error: 'Error del servidor al registrar el producto.' });
    }

    const idProductoInsertado = result.insertId; // Capturamos el ID autogenerado del producto

    // 2. Si el empleado nos envió desglose de variantes por renglón, los guardamos en producto_variantes
    if (variantes && Array.isArray(variantes) && variantes.length > 0) {
      let variantesGuardadas = 0;
      let huboErrorVariante = false;

      variantes.forEach((v) => {
        const queryVariante = `
          INSERT INTO producto_variantes (id_producto, color, rodado_talla, stock)
          VALUES (?, ?, ?, ?)
        `;

        db.query(queryVariante, [idProductoInsertado, v.color || 'Único', v.size || 'Único', Number(v.stock || 0)], (errVar) => {
          if (errVar) {
            console.error('Error al insertar fila en producto_variantes:', errVar);
            huboErrorVariante = true;
          }
          
          variantesGuardadas++;
          if (variantesGuardadas === variantes.length) {
            if (huboErrorVariante) {
              return res.status(201).json({ message: 'Producto guardado, pero algunas variantes no se pudieron desglosar.' });
            }
            return res.status(201).json({ message: '¡Producto y desglose completo de stock por variantes guardado con éxito!' });
          }
        });
      });
    } else {
      // Si se cargó un accesorio simple sin variantes, creamos un renglón por defecto automáticamente
      const queryVarianteDefault = `
        INSERT INTO producto_variantes (id_producto, color, rodado_talla, stock)
        VALUES (?, 'Único', 'Único', ?)
      `;
      db.query(queryVarianteDefault, [idProductoInsertado, stock || 0], () => {
        return res.status(201).json({ message: 'Producto simple guardado en inventario con éxito.' });
      });
    }
  });
});

// ==========================================================
// RUTA PARA EDITAR/ACTUALIZAR UN PRODUCTO Y SUS VARIANTES
// ==========================================================
app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, imagen, id_categoria, variantes } = req.body;

  //Actualizamos la tabla principal (productos)
  const queryUpdate = 'UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ?, id_categoria = ? WHERE id = ?';
  
  db.query(queryUpdate, [nombre, descripcion, precio, stock, imagen, id_categoria, id], (err, result) => {
    if (err) {
      console.error('Error actualizando producto:', err);
      return res.status(500).json({ error: 'Error del servidor al actualizar producto.' });
    }

    // Borramos las variantes anteriores de este producto para no duplicar datos
    db.query('DELETE FROM producto_variantes WHERE id_producto = ?', [id], (errDel) => {
      if (errDel) {
        console.error('Error borrando variantes antiguas:', errDel);
        return res.status(500).json({ error: 'Error al limpiar el inventario antiguo.' });
      }

      //  Insertamos las variantes nuevas con los valores corregidos
      if (variantes && variantes.length > 0) {
        // Mapeamos el arreglo asegurando usar "v.size" que es lo que manda React
        const values = variantes.map(v => [id, v.color, v.size, v.stock]);
        const queryInsertVar = 'INSERT INTO producto_variantes (id_producto, color, rodado_talla, stock) VALUES ?';

        db.query(queryInsertVar, [values], (errIns) => {
          if (errIns) {
            console.error('Error insertando variantes nuevas:', errIns);
            return res.status(500).json({ error: 'Error al guardar el nuevo stock físico.' });
          }
          res.json({ message: '¡Producto y variantes actualizados con éxito!' });
        });
      } else {
        res.json({ message: '¡Producto actualizado con éxito!' });
      }
    });
  });
});

// ==========================================
// RUTA INVENTARIO: ELIMINAR PRODUCTO
// ==========================================
app.delete('/api/productos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM productos WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error eliminando producto:', err);
      return res.status(500).json({ error: 'Error del servidor al eliminar el producto.' });
    }
    res.json({ message: 'Producto dado de baja correctamente.' });
  });
});
// ==========================================================
// TALLER: CREAR NUEVA SOLICITUD PROTEGIDA (CLIENTE) - CORREGIDO
// ==========================================================
app.post('/api/equipo', verificarToken, (req, res) => { // <-- Se agregó el token aquí
  const { bici_modelo, equipo_dato, descripcion } = req.body;

  if (!bici_modelo || !equipo_dato || !descripcion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  // Ahora sí se inyecta req.usuarioId de manera segura en la columna creacion
  const query = `
    INSERT INTO equipo (bici_modelo, equipo_dato, descripcion, estado, creacion) 
    VALUES (?, ?, ?, 'Pendiente', ?)
  `;

  db.query(query, [bici_modelo, equipo_dato, descripcion, req.usuarioId], (err, result) => {
    if (err) {
      console.error('Error al insertar en la tabla equipo:', err);
      return res.status(500).json({ error: 'Error del servidor al guardar el turno.' });
    }
    
    res.status(201).json({ 
      message: '¡Turno solicitado con éxito!', 
      id: result.insertId 
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

// Configurar el puerto
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
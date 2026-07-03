const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');   
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); 

// Configuración de la conexión a la base de datos
const db = mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',      
    password: '',      
    database: 'bicileteria_bd' 
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

app.get('/productos', (req, res) => {
    const query = 'SELECT * FROM Productos';
    db.query(query, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

// --- NUEVA RUTA: DÍA 3 - REGISTRO ---
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

// --- NUEVA RUTA: DÍA 2 - LOGIN ---
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


// Ruta para obtener todos los turnos de la tabla equipo
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

// 2. RUTA DEL PERFIL: Trae los datos reales del usuario logueado usando su ID
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
// RUTA PARA ACTUALIZAR LOS DATOS DEL PERFIL (DÍA 8 - EXTENSIÓN)
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

// NUEVA RUTA: PROCESAR PAGO (CREAR VENTA) - OPTIMIZADA
// ==========================================
app.post('/api/ventas/pagar', verificarToken, (req, res) => {
  const { total, tipo_venta, metodo_entrega, direccion_envio, medio_pago } = req.body;

  if (!total || !tipo_venta) {
    return res.status(400).json({ error: 'Faltan datos obligatorios para procesar la venta.' });
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

  // La query con tus columnas reales de phpMyAdmin
  const query = `
    INSERT INTO ventas (id_usuario, fecha, total, tipo_venta, estado_envio) 
    VALUES (?, NOW(), ?, ?, ?)
  `;

  // Cortamos el texto o lo hacemos más corto por si la columna de tu BD es chica (VARCHAR)
  // Guardamos un resumen directo: "Web - Tarjeta - Envío a domicilio"
  const resumenCortoVenta = `Web - ${medio_pago} - ${metodo_entrega}`;

  db.query(query, [req.usuarioId, total, resumenCortoVenta, estado_envio], (err, result) => {
    if (err) {
      console.error('Error crítico al insertar la venta en MySQL:', err);
      return res.status(500).json({ error: 'Error del servidor al procesar el pago.' });
    }

    res.status(201).json({ 
      message: '¡Pago procesado con éxito y venta registrada!', 
      id_venta: result.insertId 
    });
  });
});
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
// ==========================================
// RUTA INVENTARIO: CREAR / DUPLICAR PRODUCTO
// ==========================================
app.post('/api/productos', verificarToken, (req, res) => {
  const { nombre, descripcion, precio, stock, imagen, id_categoria } = req.body;

  const query = `
    INSERT INTO productos (nombre, descripcion, precio, stock, imagen, id_categoria) 
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [nombre, descripcion, precio, stock, imagen, id_categoria || 1], (err, result) => {
    if (err) {
      console.error('Error insertando producto:', err);
      return res.status(500).json({ error: 'Error del servidor al registrar el producto.' });
    }
    res.status(201).json({ message: 'Producto guardado en inventario con éxito.', id: result.insertId });
  });
});

// ==========================================
// RUTA INVENTARIO: EDITAR DATOS Y STOCK
// ==========================================
app.put('/api/productos/:id', verificarToken, (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, imagen, id_categoria } = req.body;

  const query = `
    UPDATE productos 
    SET nombre = ?, descripcion = ?, precio = ?, stock = ?, imagen = ?, id_categoria = ? 
    WHERE id = ?
  `;

  db.query(query, [nombre, descripcion, precio, stock, imagen, id_categoria || 1, id], (err, result) => {
    if (err) {
      console.error('Error actualizando producto:', err);
      return res.status(500).json({ error: 'Error del servidor al actualizar el producto.' });
    }
    res.json({ message: '¡Producto modificado con éxito!' });
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
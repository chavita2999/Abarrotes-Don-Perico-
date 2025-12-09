// server.js - Servidor para Abarrotes Don Perico con MySQL
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'abarrotes_don_perico',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de conexión - CORRECTO
(async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT NOW() as now');
    console.log('✅ Conectado a MySQL:', rows[0].now);
    connection.release();
  } catch (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  }
})();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================
// RUTAS - SUBIR ARCHIVO EXCEL DEL CHECADOR
// ============================================

const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');

// Configurar multer para subir archivos
const upload = multer({ dest: 'uploads/' });

// Ruta para subir archivo Excel
app.post('/api/asistencias/upload-excel', upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    console.log('📁 Archivo recibido:', req.file.originalname);
    console.log('📏 Tamaño:', req.file.size, 'bytes');

    // Leer el archivo Excel
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0]; // Primera hoja
    const worksheet = workbook.Sheets[sheetName];
    
    // Convertir a JSON
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log('📊 Total de registros encontrados:', data.length);
    console.log('📋 Primeras columnas:', Object.keys(data[0] || {}));

    let registrosInsertados = 0;
    let registrosActualizados = 0;
    let registrosError = 0;
    let errores = [];

    // Procesar cada fila
    for (let i = 0; i < data.length; i++) {
      try {
        const fila = data[i];
        
        // Extraer datos (ajustar nombres de columnas según tu Excel)
        // Posibles nombres: "No.", "ID", "PIN", "Usuario", etc.
        const pin = fila['No.'] || fila['ID'] || fila['PIN'] || fila['Usuario'] || fila['Número'];
        
        // Fecha y hora pueden venir en diferentes formatos
        let fechaHora = fila['Hora'] || fila['Fecha y Hora'] || fila['DateTime'] || fila['Tiempo'];
        
        // Si no hay datos, buscar más opciones
        if (!pin || !fechaHora) {
          console.log(`⚠️  Fila ${i + 1}: Datos incompletos`, fila);
          errores.push(`Fila ${i + 1}: Datos incompletos`);
          registrosError++;
          continue;
        }

        // Convertir fecha de Excel a formato JavaScript
        let fecha, hora;
        
        if (typeof fechaHora === 'number') {
          // Excel guarda fechas como números
          const excelDate = xlsx.SSF.parse_date_code(fechaHora);
          fecha = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
          hora = `${String(excelDate.H).padStart(2, '0')}:${String(excelDate.M).padStart(2, '0')}:${String(excelDate.S).padStart(2, '0')}`;
        } else if (typeof fechaHora === 'string') {
          // Si viene como texto "2024-12-07 09:15:00"
          const partes = fechaHora.split(' ');
          fecha = partes[0];
          hora = partes[1] || '00:00:00';
        } else if (fechaHora instanceof Date) {
          // Si es un objeto Date
          fecha = fechaHora.toISOString().split('T')[0];
          hora = fechaHora.toTimeString().split(' ')[0];
        }

        console.log(`📝 Procesando: PIN=${pin}, Fecha=${fecha}, Hora=${hora}`);

        // Buscar empleado
        const [empleados] = await pool.query(
          'SELECT * FROM Empleado WHERE id_empleado = ? AND estado = "Activo"',
          [pin]
        );

        if (empleados.length === 0) {
          console.log(`⚠️  Empleado ${pin} no encontrado en la base de datos`);
          errores.push(`Empleado ${pin} no encontrado`);
          registrosError++;
          continue;
        }

        // Verificar si ya existe registro para ese día
        const [registroExistente] = await pool.query(
          'SELECT * FROM RegistroAsistencia WHERE id_empleado = ? AND fecha = ?',
          [pin, fecha]
        );

        if (registroExistente.length === 0) {
          // Primera marca del día = ENTRADA
          await pool.query(
            'INSERT INTO RegistroAsistencia (id_empleado, fecha, hora_entrada) VALUES (?, ?, ?)',
            [pin, fecha, hora]
          );
          console.log('✅ ENTRADA registrada');
          registrosInsertados++;
        } else {
          // Si ya hay entrada, actualizar con salida
          if (!registroExistente[0].hora_salida) {
            await pool.query(
              'UPDATE RegistroAsistencia SET hora_salida = ? WHERE id_registro = ?',
              [hora, registroExistente[0].id_registro]
            );
            console.log('✅ SALIDA actualizada');
            registrosActualizados++;
          } else {
            // Ya tiene entrada y salida
            console.log('ℹ️  Registro ya completo, saltando...');
          }
        }

      } catch (err) {
        console.error(`❌ Error procesando fila ${i + 1}:`, err.message);
        errores.push(`Fila ${i + 1}: ${err.message}`);
        registrosError++;
      }
    }

    // Eliminar archivo temporal
    fs.unlinkSync(req.file.path);

    console.log('📊 Resumen:');
    console.log(`   ✅ Insertados: ${registrosInsertados}`);
    console.log(`   🔄 Actualizados: ${registrosActualizados}`);
    console.log(`   ❌ Errores: ${registrosError}`);

    res.json({
      success: true,
      mensaje: 'Archivo procesado correctamente',
      totalRegistros: data.length,
      registrosInsertados,
      registrosActualizados,
      registrosError,
      errores: errores.slice(0, 10) // Solo primeros 10 errores
    });

  } catch (err) {
    console.error('❌ Error procesando Excel:', err);
    
    // Eliminar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Error al procesar el archivo Excel',
      detalle: err.message 
    });
  }
});

app.get('/api/empleados', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM Empleado WHERE estado = 'Activo' ORDER BY nombre, apellido"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener empleados' });
  }
});

app.get('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM Empleado WHERE id_empleado = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener empleado' });
  }
});

app.post('/api/empleados', async (req, res) => {
  try {
    const { nombre, apellido, telefono, pago_x_hora, horario_entrada, horario_salida } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO Empleado (nombre, apellido, telefono, pago_x_hora, estado, horario_entrada, horario_salida)
       VALUES (?, ?, ?, ?, 'Activo', ?, ?)`,
      [nombre, apellido, telefono, pago_x_hora, horario_entrada, horario_salida]
    );
    
    const [newEmpleado] = await pool.query('SELECT * FROM Empleado WHERE id_empleado = ?', [result.insertId]);
    res.status(201).json(newEmpleado[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear empleado' });
  }
});

app.put('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, telefono, pago_x_hora, horario_entrada, horario_salida, estado } = req.body;
    
    await pool.query(
      `UPDATE Empleado 
       SET nombre = ?, apellido = ?, telefono = ?, pago_x_hora = ?, 
           horario_entrada = ?, horario_salida = ?, estado = ?
       WHERE id_empleado = ?`,
      [nombre, apellido, telefono, pago_x_hora, horario_entrada, horario_salida, estado, id]
    );
    
    const [updatedEmpleado] = await pool.query('SELECT * FROM Empleado WHERE id_empleado = ?', [id]);
    res.json(updatedEmpleado[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar empleado' });
  }
});

app.delete('/api/empleados/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("UPDATE Empleado SET estado = 'Inactivo' WHERE id_empleado = ?", [id]);
    res.json({ message: 'Empleado desactivado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al desactivar empleado' });
  }
});

// ============================================
// RUTAS - ASISTENCIAS
// ============================================

app.get('/api/asistencias', async (req, res) => {
  try {
    const { id_empleado, fecha_inicio, fecha_fin } = req.query;
    
    let query = `
      SELECT r.*, e.nombre, e.apellido, e.pago_x_hora,
             TIMESTAMPDIFF(SECOND, r.hora_entrada, r.hora_salida) / 3600 as horas_trabajadas
      FROM RegistroAsistencia r
      JOIN Empleado e ON r.id_empleado = e.id_empleado
      WHERE 1=1
    `;
    const params = [];
    
    if (id_empleado) {
      query += ` AND r.id_empleado = ?`;
      params.push(id_empleado);
    }
    
    if (fecha_inicio) {
      query += ` AND r.fecha >= ?`;
      params.push(fecha_inicio);
    }
    
    if (fecha_fin) {
      query += ` AND r.fecha <= ?`;
      params.push(fecha_fin);
    }
    
    query += ' ORDER BY r.fecha DESC, r.hora_entrada DESC';
    
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asistencias' });
  }
});

app.get('/api/asistencias/hoy', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.*, e.nombre, e.apellido,
              TIMESTAMPDIFF(SECOND, r.hora_entrada, r.hora_salida) / 3600 as horas_trabajadas
       FROM RegistroAsistencia r
       JOIN Empleado e ON r.id_empleado = e.id_empleado
       WHERE r.fecha = CURDATE()
       ORDER BY r.hora_entrada`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener asistencias de hoy' });
  }
});

app.post('/api/asistencias/entrada', async (req, res) => {
  try {
    const { id_empleado, fecha, hora_entrada } = req.body;
    
    const [existe] = await pool.query(
      'SELECT * FROM RegistroAsistencia WHERE id_empleado = ? AND fecha = ?',
      [id_empleado, fecha]
    );
    
    if (existe.length > 0) {
      return res.status(400).json({ error: 'Ya existe un registro de entrada para hoy' });
    }
    
    const [result] = await pool.query(
      'INSERT INTO RegistroAsistencia (id_empleado, fecha, hora_entrada) VALUES (?, ?, ?)',
      [id_empleado, fecha, hora_entrada]
    );
    
    const [newAsistencia] = await pool.query('SELECT * FROM RegistroAsistencia WHERE id_registro = ?', [result.insertId]);
    res.status(201).json(newAsistencia[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar entrada' });
  }
});

app.put('/api/asistencias/salida/:id_registro', async (req, res) => {
  try {
    const { id_registro } = req.params;
    const { hora_salida } = req.body;
    
    await pool.query(
      'UPDATE RegistroAsistencia SET hora_salida = ? WHERE id_registro = ?',
      [hora_salida, id_registro]
    );
    
    const [updated] = await pool.query('SELECT * FROM RegistroAsistencia WHERE id_registro = ?', [id_registro]);
    
    if (updated.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }
    
    res.json(updated[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar salida' });
  }
});

// ============================================
// RUTAS - DASHBOARD
// ============================================

app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const [[empleados]] = await pool.query(
      "SELECT COUNT(*) as total FROM Empleado WHERE estado = 'Activo'"
    );
    
    const [[asistenciasHoy]] = await pool.query(
      'SELECT COUNT(*) as total FROM RegistroAsistencia WHERE fecha = CURDATE()'
    );
    
    const [[horasSemana]] = await pool.query(
      `SELECT COALESCE(SUM(TIMESTAMPDIFF(SECOND, hora_entrada, hora_salida) / 3600), 0) as total
       FROM RegistroAsistencia
       WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
         AND hora_salida IS NOT NULL`
    );
    
    res.json({
      empleados_activos: empleados.total,
      asistencias_hoy: asistenciasHoy.total,
      horas_semanales: parseFloat(horasSemana.total).toFixed(2)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});
// Redirección de raíz a login
app.get('/', (req, res) => {
  res.redirect('/login.html');
});
// ============================================
// RUTAS - AUTENTICACIÓN
// ============================================

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const [users] = await pool.query(
      "SELECT * FROM Usuario WHERE username = ? AND estado = 'Activo'",
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    
    const user = users[0];
    
    // Validar contraseña (por ahora sin encriptar, luego usaremos bcrypt)
    if (password !== user.password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Login exitoso
    res.json({
      success: true,
      user: {
        id: user.id_usuario,
        nombre: user.nombre,
        rol: user.rol,
        username: user.username
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});
// ============================================
// RUTAS - IMPORTAR ASISTENCIAS DESDE ESP32
// ============================================

app.post('/api/asistencias/importar', async (req, res) => {
  try {
    const { pin, fecha, hora } = req.body;
    
    console.log('📥 Datos recibidos del ESP32:', { pin, fecha, hora });
    
    // Buscar empleado por PIN (puedes agregar campo PIN a tabla Empleado)
    // Por ahora, buscaremos por ID
    const [empleados] = await pool.query(
      'SELECT * FROM Empleado WHERE id_empleado = ? AND estado = "Activo"',
      [pin]
    );
    
    if (empleados.length === 0) {
      return res.status(404).json({ error: 'Empleado no encontrado' });
    }
    
    const empleado = empleados[0];
    
    // Verificar si ya existe registro para ese día
    const [registroExistente] = await pool.query(
      'SELECT * FROM RegistroAsistencia WHERE id_empleado = ? AND fecha = ?',
      [pin, fecha]
    );
    
    if (registroExistente.length === 0) {
      // Primera marca del día = ENTRADA
      await pool.query(
        'INSERT INTO RegistroAsistencia (id_empleado, fecha, hora_entrada) VALUES (?, ?, ?)',
        [pin, fecha, hora]
      );
      
      console.log('✅ ENTRADA registrada:', empleado.nombre, fecha, hora);
      res.json({ success: true, tipo: 'entrada', mensaje: 'Entrada registrada' });
      
    } else {
      // Segunda marca del día = SALIDA
      await pool.query(
        'UPDATE RegistroAsistencia SET hora_salida = ? WHERE id_registro = ?',
        [hora, registroExistente[0].id_registro]
      );
      
      console.log('✅ SALIDA registrada:', empleado.nombre, fecha, hora);
      res.json({ success: true, tipo: 'salida', mensaje: 'Salida registrada' });
    }
    
  } catch (err) {
    console.error('❌ Error al importar asistencia:', err);
    res.status(500).json({ error: 'Error al importar asistencia' });
  }
});


app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${process.env.DB_NAME || 'abarrotes_don_perico'}`);
});
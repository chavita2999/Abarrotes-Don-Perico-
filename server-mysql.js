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

// Test de conexión
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
// RUTAS - EMPLEADOS
// ============================================

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

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${process.env.DB_NAME || 'abarrotes_don_perico'}`);
});
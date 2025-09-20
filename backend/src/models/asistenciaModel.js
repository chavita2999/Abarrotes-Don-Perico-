// backend/src/models/asistenciaModel.js
import pool from "../config/db.js";

export async function registrarAsistencia(empleado_id, fecha, hora_entrada, hora_salida) {
  const [result] = await pool.query(
    "INSERT INTO asistencias (empleado_id, fecha, hora_entrada, hora_salida) VALUES (?, ?, ?, ?)",
    [empleado_id, fecha, hora_entrada, hora_salida]
  );
  return result.insertId;
}

export async function obtenerHistorial(empleado_id) {
  const [rows] = await pool.query(
    "SELECT * FROM asistencias WHERE empleado_id = ? ORDER BY fecha DESC",
    [empleado_id]
  );
  return rows;
}

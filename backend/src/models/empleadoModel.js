// backend/src/models/empleadoModel.js
import pool from "../config/db.js";

export async function crearEmpleado(nombre, puesto, salario_hora) {
  const [result] = await pool.query(
    "INSERT INTO empleados (nombre, puesto, salario_hora) VALUES (?, ?, ?)",
    [nombre, puesto, salario_hora]
  );
  return result.insertId;
}

export async function obtenerEmpleados() {
  const [rows] = await pool.query("SELECT * FROM empleados");
  return rows;
}


// backend/src/controllers/empleadoController.js
import { crearEmpleado, obtenerEmpleados } from "../models/empleadoModel.js";

export async function nuevoEmpleado(req, res) {
  const { nombre, puesto, salario_hora } = req.body;

  if (
    typeof nombre !== "string" ||
    typeof puesto !== "string" ||
    typeof salario_hora !== "number" ||
    !nombre.trim() ||
    !puesto.trim() ||
    salario_hora <= 0
  ) {
    return res.status(400).json({ error: "Datos inválidos para el empleado." });
  }

  const id = await crearEmpleado(nombre, puesto, salario_hora);
  res.json({ message: "Empleado registrado", id });
}

export async function listarEmpleados(req, res) {
  const empleados = await obtenerEmpleados();
  res.json(empleados);
}

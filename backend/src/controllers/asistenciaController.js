// backend/src/controllers/asistenciaController.js
import { registrarAsistencia, obtenerHistorial } from "../models/asistenciaModel.js";

export async function nuevaAsistencia(req, res) {
  const { empleado_id, fecha, hora_entrada, hora_salida } = req.body;

  if (
    typeof empleado_id !== "number" ||
    typeof fecha !== "string" ||
    typeof hora_entrada !== "string" ||
    typeof hora_salida !== "string"
  ) {
    return res.status(400).json({ error: "Datos de asistencia inválidos" });
  }

  const id = await registrarAsistencia(empleado_id, fecha, hora_entrada, hora_salida);
  res.json({ message: "Asistencia registrada", id });
}

export async function historialEmpleado(req, res) {
  const { id } = req.params;
  const historial = await obtenerHistorial(id);
  res.json(historial);
}

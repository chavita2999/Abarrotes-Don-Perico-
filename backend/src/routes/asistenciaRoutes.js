// backend/src/routes/asistenciaRoutes.js
import express from "express";
import { nuevaAsistencia, historialEmpleado } from "../controllers/asistenciaController.js";

const router = express.Router();

router.post("/", nuevaAsistencia);
router.get("/:id", historialEmpleado);

export default router;

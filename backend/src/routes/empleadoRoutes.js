// backend/src/routes/empleadoRoutes.js
import express from "express";
import { nuevoEmpleado, listarEmpleados } from "../controllers/empleadoController.js";

const router = express.Router();

router.post("/", nuevoEmpleado);
router.get("/", listarEmpleados);

export default router;

// backend/src/app.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import empleadoRoutes from "./routes/empleadoRoutes.js";
import asistenciaRoutes from "./routes/asistenciaRoutes.js";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Rutas
app.use("/api/empleados", empleadoRoutes);
app.use("/api/asistencias", asistenciaRoutes);

export default app;

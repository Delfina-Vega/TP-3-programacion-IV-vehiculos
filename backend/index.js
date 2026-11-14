import express from "express";
import cors from "cors";
import { conectarDB } from "./db.js";
import vehiculosRouter from "./vehiculos.js";
import usuariosRouter from "./usuarios.js";
import authRouter, { authConfig } from "./auth.js";
import conductoresRouter from "./conductores.js";

conectarDB();

const app = express();
const port = 3000;

// Para interpretar body como JSON
app.use(express.json());

// Habilito CORS
app.use(cors());

// Configurar passport
authConfig();

app.get("/", (req, res) => {
  // Responder con string
  res.send("Hola mundo!");
});

app.use("/vehiculos", vehiculosRouter);
app.use("/usuarios", usuariosRouter);
app.use("/auth", authRouter);
app.use("/conductores", conductoresRouter);

app.listen(port, () => {
  console.log(`La aplicación esta funcionando en ${port}`);
});
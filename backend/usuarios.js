import express from "express";
import { db } from "./db.js";
import { verificarValidaciones } from "./validaciones.js";
import { body } from "express-validator";
import bcrypt from "bcrypt";

const router = express.Router();

// Registro de usuarios (ruta publica)

router.post(
  "/",
  [
    body("nombre").isAlphanumeric("es-ES", { ignore: " " }) 
    .isLength({ min: 1, max: 100 }),
    body("email").isEmail().isLength({ max: 100 }),
    body("password").isStrongPassword({
      minLength: 8, // Minimo de 8 caracteres
      minLowercase: 1, // Al menos una letra en minusculas
      minUppercase: 0, // Letras mayusculas opcionales
      minNumbers: 1, // Al menos un número
      minSymbols: 0, // Símbolos opcionales
    })
    .isLength({ max: 50 }),
  ],

  verificarValidaciones,
  async (req, res) => {
    try {
        const { nombre, email, password } = req.body;

    // Creamos Hash de la contraseña con bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    const [result] = await db.execute(
      "INSERT INTO usuarios (nombre, email, password) VALUES (?,?,?)",
      [nombre, email, hashedPassword],
    );

    //Nunca se devuelve la contraseña
    res
      .status(201)
      .json({ id: result.insertId, nombre, email });
  } catch (e) {
    //Email ya resgistrado 
    if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "El email ya esta registrado" });
    }

    console.error(e.message);
    res.status(500).json({ error: "Error interno del servidor" });
  } 
 },
);

export default router;
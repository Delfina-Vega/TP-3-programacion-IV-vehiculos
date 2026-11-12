import express from "express";
import { db } from "./db.js";
import { verificarValidaciones } from "./validaciones.js";
import { body } from "express-validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy, ExtractJwt } from "passport-jwt";

const router = express.Router();

export function authConfig() {
  // Opciones de configuracion de passport-jwt
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  };

  // Creo estrategia jwt
  passport.use(
    new Strategy(jwtOptions, async (payload, next) => {
      // Si llegamos a este punto es porque el token es valido
      next(null, payload);
    }),
  );
}

router.post(
  "/login",
  [
    body("email").isEmail().isLength({ max: 100 }),
    body("password").notEmpty().isLength({ max: 50 }),
  ],
  verificarValidaciones,
  async (req, res) => {
    try{
        const { email, password } = req.body;

    // Consultar por el usuario a la base de datos
    const [usuarios] = await db.execute(
      "SELECT * FROM usuarios WHERE email=?",
      [email],
    );

    //Mismo mensaje si no existe el usuario o si la contraseña no coincide
    if (usuarios.length === 0) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    // Verificar la contraseña en el hash guardado
    const passwordComparada = await bcrypt.compare(password, usuarios[0].password,

    );

    if (!passwordComparada) {
      return res.status(401).json({ error: "Credenciales invalidas" });
    }

    // Generar jwt con expiracion de 4 horas
    const payload = {
      userId: usuarios[0].id };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "4h",
    });

    // Devolver token y datos del usuario (nunca la contraseña)
    res.json({
      token,
      nombre: usuarios[0].nombre,
      email: usuarios[0].email,
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Error interno del servidor" })
  } 
  },
);

export default router;
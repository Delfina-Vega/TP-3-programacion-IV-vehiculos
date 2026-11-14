import { body, param, query, validationResult } from "express-validator";
import passport from "passport";

// Validacion de autenticacion
export const validarAutenticacion = passport.authenticate("jwt", {
  session: false,
});

// Validacion de filtros de productos
export const validarFiltrosProductos = [
  query("nombre").isAlpha("es-ES").optional(),
  query("cantidadMin").isInt({ min: 1 }).optional(),
  query("cantidadMax").isInt({ min: 1 }).optional(),
];

export const validarId = param("id").isInt({ min: 1 });

// Validacion de producto
export const validarProducto = [
  body("nombre")
    .isAlpha("es-ES")
    .withMessage("Solo letras")
    .isLength({ min: 1, max: 45 })
    .withMessage("Solo entre 1 y 45 caracteres"),
  body("categoriaId")
    .isInt({ min: 1 })
    .withMessage("categoriaId debe ser un numero positivo mayor a 0"),
  body("cantidad")
    .isInt({ min: 0 })
    .withMessage("Solo numeros positivos o cero"),
];

// Validacion de categoria
export const validarCategoria = [
  body("nombre").isAlpha("es-ES", { ignore: " " }).isLength({ max: 50 }),
];

// Validacion de filtros de vehiculos
export const validarFiltrosVehiculos = [
  query("marca").optional().trim().isLength({ max: 50 }),
];

// Validacion de vehiculo
export const validarVehiculo = [
  body("marca")
    .trim()
    .isLength({ min: 1, max: 45 })
    .withMessage("La marca debe tener entre 1 y 50 caracteres"),
  body("modelo")
    .trim()
    .isLength({ min: 1, max: 45 })
    .withMessage("El modelo debe tener entre 1 y 50 caracteres"),
  body("patente")
    .trim()
    .toUpperCase()
    .matches(/^([A-Z]{3}[0-9]{3}|[A-Z]{2}[0-9]{3}[A-Z]{2})$/)
    .withMessage("Patente inválida (Dbe contener 3 letras y 3 numeros, o 2 letras, 3 numeros y 2 letras)"),
  body("anio")
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage("Año inválido"),
  body("capacidadCarga")
    .isFloat({ gt: 0 })
    .withMessage("La capacidad de carga debe ser un número mayor a 0"),
];

// Middleware para verificar validaciones
export const verificarValidaciones = (req, res, next) => {
  const resultadoValidacion = validationResult(req);
  if (!resultadoValidacion.isEmpty()) {
    return res.status(400).json({
      mensaje: "Parámetros no válidos",
      errores: resultadoValidacion.array(),
    });
  }
  next();
};
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

// Validacion de filtros de conductores
export const validarFiltrosConductores = [
  query("apellido").optional().trim().isLength({ max: 50 }),
];

// Validacion de conductor
export const validarConductor = [
  body("nombre")
    .trim()
    .isAlpha("es-ES", { ignore: " '-" })
    .isLength({ min: 1, max: 50 })
    .withMessage("El nombre debe tener solo letras (hasta 50 caracteres)"),
  body("apellido")
    .trim()
    .isAlpha("es-ES", { ignore: " '-" })
    .isLength({ min: 1, max: 50 })
    .withMessage("El apellido debe tener solo letras (hasta 50 caracteres)"),
  body("numeroDocumento")
    .trim()
    .isNumeric({ no_symbols: true })
    .isLength({ min: 7, max: 10 })
    .withMessage("El documento debe tener entre 7 y 10 números"),
  body("numeroLicencia")
    .trim()
    .isAlphanumeric("es-ES")
    .isLength({ min: 5, max: 20 })
    .withMessage("La licencia debe tener entre 5 y 20 letras o números"),
  body("fechaAltaLicencia")
    .isDate({ format: "YYYY-MM-DD", strictMode: true })
    .withMessage("Fecha de alta inválida (formato AAAA-MM-DD)"),
  body("fechaVencimientoLicencia")
    .isDate({ format: "YYYY-MM-DD", strictMode: true })
    .withMessage("Fecha de vencimiento inválida (formato AAAA-MM-DD)")
    .custom((valor, { req }) => {  //.custom compara dos fechas como texto
      if (valor <= req.body.fechaAltaLicencia) {
        throw new Error("El vencimiento debe ser posterior al alta");
      }
      return true;
    }),
];

// Validacion de filtros de viajes, historial por vehiculo o por conductor
export const validarFiltrosViajes = [
  query("vehiculoId").optional().isInt({ min: 1 }),
  query("conductorId").optional().isInt({ min: 1 }),
];

// Formato aceptado: 2026-11-14T08:30 (o con espacio y segundos opcionales)
const FORMATO_FECHA_HORA = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2})?$/;

// Validacion de viaje
export const validarViaje = [
  body("vehiculoId")
    .isInt({ min: 1 })
    .withMessage("vehiculoId debe ser un numero mayor a 0"),
  body("conductorId")
    .isInt({ min: 1 })
    .withMessage("conductorId debe ser un numero mayor a 0"),
  body("fechaSalida")
    .matches(FORMATO_FECHA_HORA)
    .withMessage("Fecha de salida invalida (formato AAAA-MM-DDTHH:MM)")
    .custom((valor) => {
      if (isNaN(Date.parse(valor))) {
        throw new Error("Fecha de salida invalida");
      }
      return true;
    }),
  body("fechaLlegada")
    .matches(FORMATO_FECHA_HORA)
    .withMessage("Fecha de llegada invalida (formato AAAA-MM-DDTHH:MM)")
    .custom((valor, { req }) => {
      const llegada = Date.parse(valor);
      if (isNaN(llegada)) {
        throw new Error("Fecha de llegada invalida");
      }
      if (llegada < Date.parse(req.body.fechaSalida)) {
        throw new Error("La llegada no puede ser anterior a la salida");
      }
      return true;
    }),

  body("origen")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("El origen debe tener entre 1 y 100 caracteres"),
  body("destino")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("El destino debe tener entre 1 y 100 caracteres"),
  body("kilometros")
    .isFloat({ gt: 0, max: 99999999 })
    .withMessage("Los kilometros deben ser un numero mayor a 0"),
  body("observaciones")
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Las observaciones admiten hasta 1000 caracteres"),
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
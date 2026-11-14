import express from "express";
import { db } from "./db.js";
import {
  validarAutenticacion,
  validarConductor,
  validarFiltrosConductores,
  validarId,
  verificarValidaciones,
} from "./validaciones.js";

const router = express.Router();

// DATE_FORMAT evita que las fechas lleguen como objetos Date con zona horaria

const COLUMNAS =
  "id, nombre, apellido, numero_documento AS numeroDocumento, " +
  "numero_licencia AS numeroLicencia, " +
  "DATE_FORMAT(fecha_alta_licencia, '%Y-%m-%d') AS fechaAltaLicencia, " +
  "DATE_FORMAT(fecha_vencimiento_licencia, '%Y-%m-%d') AS fechaVencimientoLicencia";

// GET para entregar listado de conductores (filtro opcional por apellido)
router.get(
  "/",
  validarAutenticacion,
  validarFiltrosConductores,
  verificarValidaciones,
  async (req, res) => {
    try {
      const { apellido } = req.query;
      let sql = `SELECT ${COLUMNAS} FROM conductores`;
      const parametros = [];

      if (apellido) {
        sql += " WHERE apellido LIKE ?";
        parametros.push(`%${apellido}%`);
      }
      sql += " ORDER BY apellido, nombre";

      const [conductores] = await db.execute(sql, parametros);
      res.json(conductores);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// GET para entregar detalle de un conductor
router.get(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [conductores] = await db.execute(
        `SELECT ${COLUMNAS} FROM conductores WHERE id = ?`,
        [id],
      );

      if (conductores.length === 0) {
        return res.status(404).json({ error: "Conductor no encontrado" });
      }

      res.json(conductores[0]);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// POST para crear conductor
router.post(
  "/",
  validarAutenticacion,
  validarConductor,
  verificarValidaciones,
  async (req, res) => {
    try {
      const {
        nombre,
        apellido,
        numeroDocumento,
        numeroLicencia,
        fechaAltaLicencia,
        fechaVencimientoLicencia,
      } = req.body;

      const [result] = await db.execute(
        "INSERT INTO conductores (nombre, apellido, numero_documento, numero_licencia, fecha_alta_licencia, fecha_vencimiento_licencia) VALUES (?,?,?,?,?,?)",
        [
          nombre,
          apellido,
          numeroDocumento,
          numeroLicencia,
          fechaAltaLicencia,
          fechaVencimientoLicencia,
        ],
      );

      res.status(201).json({
        id: result.insertId,
        nombre,
        apellido,
        numeroDocumento,
        numeroLicencia,
        fechaAltaLicencia,
        fechaVencimientoLicencia,
      });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "El numero de documento o de licencia ya esta registrado",
        });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// PUT para modificar conductor
router.put(
  "/:id",
  validarAutenticacion,
  validarId,
  validarConductor,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        nombre,
        apellido,
        numeroDocumento,
        numeroLicencia,
        fechaAltaLicencia,
        fechaVencimientoLicencia,
      } = req.body;

      const [result] = await db.execute(
        "UPDATE conductores SET nombre=?, apellido=?, numero_documento=?, numero_licencia=?, fecha_alta_licencia=?, fecha_vencimiento_licencia=? WHERE id=?",
        [
          nombre,
          apellido,
          numeroDocumento,
          numeroLicencia,
          fechaAltaLicencia,
          fechaVencimientoLicencia,
          id,
        ],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Conductor no encontrado" });
      }

      res.json({
        id,
        nombre,
        apellido,
        numeroDocumento,
        numeroLicencia,
        fechaAltaLicencia,
        fechaVencimientoLicencia,
      });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "El número de documento o de licencia ya esta registrado",
        });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// DELETE para eliminar conductor
router.delete(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [result] = await db.execute("DELETE FROM conductores WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Conductor no encontrado" });
      }

      res.json({ mensaje: "Conductor eliminado" });
    } catch (e) {
      // El conductor tiene viajes asociados (clave forsnea)
      if (e.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          error: "No se puede eliminar: el conductor tiene viajes registrados",
        });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);
 
export default router;
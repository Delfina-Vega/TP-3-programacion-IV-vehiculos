import express from "express";
import { db } from "./db.js";
import {
  validarAutenticacion,
  validarFiltrosViajes,
  validarId,
  validarViaje,
  verificarValidaciones,
} from "./validaciones.js";

const router = express.Router();

// Las fechas salen como "2026-11-14T08:30", el formato que usa el input
// datetime-local del frontend
const COLUMNAS = `
  vj.id,
  vj.vehiculo_id AS vehiculoId,
  vj.conductor_id AS conductorId,
  DATE_FORMAT(vj.fecha_salida, '%Y-%m-%dT%H:%i') AS fechaSalida,
  DATE_FORMAT(vj.fecha_llegada, '%Y-%m-%dT%H:%i') AS fechaLlegada,
  vj.origen,
  vj.destino,
  vj.kilometros,
  vj.observaciones,
  ve.patente,
  ve.marca,
  ve.modelo,
  co.nombre AS conductorNombre,
  co.apellido AS conductorApellido`;

const DESDE = `
  FROM viajes vj
  JOIN vehiculos ve ON vj.vehiculo_id = ve.id
  JOIN conductores co ON vj.conductor_id = co.id`;

// Convierte "2026-11-14T08:30" en "2026-11-14 08:30:00" para MySQL
function aFechaMySQL(valor) {
  const texto = valor.replace("T", " ");
  return texto.length === 16 ? `${texto}:00` : texto;
}

// Arma el WHERE segun los filtros vehiculoId / conductorId
function armarFiltros(query) {
  const filtros = [];
  const parametros = [];

  if (query.vehiculoId) {
    filtros.push("vj.vehiculo_id = ?");
    parametros.push(Number(query.vehiculoId));
  }
  if (query.conductorId) {
    filtros.push("vj.conductor_id = ?");
    parametros.push(Number(query.conductorId));
  }

  const where = filtros.length > 0 ? " WHERE " + filtros.join(" AND ") : "";
  return { where, parametros };
}

// GET total de kilometros y cantidad de viajes (por vehiculo y/o conductor)
router.get(
  "/kilometros",
  validarAutenticacion,
  validarFiltrosViajes,
  verificarValidaciones,
  async (req, res) => {
    try {
      const { where, parametros } = armarFiltros(req.query);

      const [filas] = await db.execute(
        "SELECT COUNT(*) AS cantidadViajes, " +
          "COALESCE(SUM(vj.kilometros), 0) AS totalKilometros " +
          "FROM viajes vj" +
          where,
        parametros,
      );

      res.json({
        cantidadViajes: Number(filas[0].cantidadViajes),
        totalKilometros: Number(filas[0].totalKilometros),
      });
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// GET listado / historial de viajes (filtros opcionales vehiculoId, conductorId)
router.get(
  "/",
  validarAutenticacion,
  validarFiltrosViajes,
  verificarValidaciones,
  async (req, res) => {
    try {
      const { where, parametros } = armarFiltros(req.query);

      const [viajes] = await db.execute(
        `SELECT ${COLUMNAS} ${DESDE}${where} ORDER BY vj.fecha_salida DESC`,
        parametros,
      );

      res.json(viajes);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// GET detalle de un viaje
router.get(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [viajes] = await db.execute(
        `SELECT ${COLUMNAS} ${DESDE} WHERE vj.id = ?`,
        [id],
      );

      if (viajes.length === 0) {
        return res.status(404).json({ error: "Viaje no encontrado" });
      }

      res.json(viajes[0]);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// POST para registrar un viaje
router.post(
  "/",
  validarAutenticacion,
  validarViaje,
  verificarValidaciones,
  async (req, res) => {
    try {
      const {
        vehiculoId,
        conductorId,
        fechaSalida,
        fechaLlegada,
        origen,
        destino,
        kilometros,
        observaciones,
      } = req.body;

      const [result] = await db.execute(
        "INSERT INTO viajes (vehiculo_id, conductor_id, fecha_salida, fecha_llegada, origen, destino, kilometros, observaciones) VALUES (?,?,?,?,?,?,?,?)",
        [
          Number(vehiculoId),
          Number(conductorId),
          aFechaMySQL(fechaSalida),
          aFechaMySQL(fechaLlegada),
          origen,
          destino,
          kilometros,
          observaciones || null,
        ],
      );

      res.status(201).json({
        id: result.insertId,
        vehiculoId: Number(vehiculoId),
        conductorId: Number(conductorId),
        fechaSalida,
        fechaLlegada,
        origen,
        destino,
        kilometros,
        observaciones: observaciones || null,
      });
    } catch (e) {
      // El vehiculo o el conductor indicado no existe por clave foranea
      if (e.code === "ER_NO_REFERENCED_ROW_2") {
        return res
          .status(400)
          .json({ error: "El vehiculo o el conductor indicado no existe" });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// PUT para modificar un viaje
router.put(
  "/:id",
  validarAutenticacion,
  validarId,
  validarViaje,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const {
        vehiculoId,
        conductorId,
        fechaSalida,
        fechaLlegada,
        origen,
        destino,
        kilometros,
        observaciones,
      } = req.body;

      const [result] = await db.execute(
        "UPDATE viajes SET vehiculo_id=?, conductor_id=?, fecha_salida=?, fecha_llegada=?, origen=?, destino=?, kilometros=?, observaciones=? WHERE id=?",
        [
          Number(vehiculoId),
          Number(conductorId),
          aFechaMySQL(fechaSalida),
          aFechaMySQL(fechaLlegada),
          origen,
          destino,
          kilometros,
          observaciones || null,
          id,
        ],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Viaje no encontrado" });
      }

      res.json({
        id,
        vehiculoId: Number(vehiculoId),
        conductorId: Number(conductorId),
        fechaSalida,
        fechaLlegada,
        origen,
        destino,
        kilometros,
        observaciones: observaciones || null,
      });
    } catch (e) {
      if (e.code === "ER_NO_REFERENCED_ROW_2") {
        return res
          .status(400)
          .json({ error: "El vehiculo o el conductor indicado no existe" });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// DELETE para eliminar un viaje
router.delete(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [result] = await db.execute("DELETE FROM viajes WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Viaje no encontrado" });
      }

      res.json({ mensaje: "Viaje eliminado" });
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

export default router;
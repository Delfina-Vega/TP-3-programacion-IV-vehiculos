import express from "express";
import { db } from "./db.js";
import {
  validarAutenticacion,
  validarFiltrosVehiculos,
  validarId,
  validarVehiculo,
  verificarValidaciones,
} from "./validaciones.js";

const router = express.Router();

const COLUMNAS =
  "id, marca, modelo, patente, anio, capacidad_carga AS capacidadCarga";

// GET para entregar listado de vehiculos, filtro opcional por marca
router.get(
  "/",
  validarAutenticacion,
  validarFiltrosVehiculos,
  verificarValidaciones,
  async (req, res) => {
    try {
      const { marca } = req.query;
      let sql = `SELECT ${COLUMNAS} FROM vehiculos`;
      const parametros = [];

      if (marca) {
        sql += " WHERE marca LIKE ?";
        parametros.push(`%${marca}%`);
      }
      sql += " ORDER BY marca, modelo";

      const [vehiculos] = await db.execute(sql, parametros);
      res.json(vehiculos);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// GET para entregar detalle de un vehiculo
router.get(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [vehiculos] = await db.execute(
        `SELECT ${COLUMNAS} FROM vehiculos WHERE id = ?`,
        [id],
      );

      if (vehiculos.length === 0) {
        return res.status(404).json({ error: "Vehiculo no encontrado" });
      }

      res.json(vehiculos[0]);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// POST para crear vehículo
router.post(
  "/",
  validarAutenticacion,
  validarVehiculo,
  verificarValidaciones,
  async (req, res) => {
    try {
      const { marca, modelo, patente, anio, capacidadCarga } = req.body;

      const [result] = await db.execute(
        "INSERT INTO vehiculos (marca, modelo, patente, anio, capacidad_carga) VALUES (?,?,?,?,?)",
        [marca, modelo, patente, anio, capacidadCarga],
      );

      res
        .status(201)
        .json({ id: result.insertId, marca, modelo, patente, anio, capacidadCarga });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "La patente ya está registrada" });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// PUT para modificar vehiculo
router.put(
  "/:id",
  validarAutenticacion,
  validarId,
  validarVehiculo,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { marca, modelo, patente, anio, capacidadCarga } = req.body;

      const [result] = await db.execute(
        "UPDATE vehiculos SET marca=?, modelo=?, patente=?, anio=?, capacidad_carga=? WHERE id=?",
        [marca, modelo, patente, anio, capacidadCarga, id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Vehículo no encontrado" });
      }

      res.json({ id, marca, modelo, patente, anio, capacidadCarga });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ error: "La patente ya está registrada" });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

// DELETE para eliminar vehiculo
router.delete(
  "/:id",
  validarAutenticacion,
  validarId,
  verificarValidaciones,
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [result] = await db.execute("DELETE FROM vehiculos WHERE id = ?", [
        id,
      ]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Vehiculo no encontrado" });
      }

      res.json({ mensaje: "Vehículo eliminado" });
    } catch (e) {
        
      // El vehiculo tiene viajes asociados (clave foránea)
      if (e.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(409).json({
          error: "No se puede eliminar: el vehículo tiene viajes registrados",
        });
      }
      console.error(e.message);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  },
);

export default router;
const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const items = await prisma.gearItem.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }] });
  res.json(items);
});

router.post("/", async (req, res) => {
  const { category, name, notes } = req.body;
  if (!category || !name) return res.status(400).json({ error: "category and name are required" });
  const count = await prisma.gearItem.count({ where: { category } });
  const item = await prisma.gearItem.create({ data: { category, name, notes, order: count } });
  res.status(201).json(item);
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { packed, name, notes } = req.body;
  const data = {};
  if (packed !== undefined) data.packed = packed;
  if (name !== undefined) data.name = name;
  if (notes !== undefined) data.notes = notes;
  const item = await prisma.gearItem.update({ where: { id }, data });
  res.json(item);
});

router.delete("/:id", async (req, res) => {
  await prisma.gearItem.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

module.exports = router;

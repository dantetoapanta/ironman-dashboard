const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const { type } = req.query;
  const tests = await prisma.fitnessTest.findMany({
    where: type ? { type } : undefined,
    orderBy: { date: "asc" },
  });
  res.json(tests);
});

router.post("/", async (req, res) => {
  const { type, date, value, unit, notes } = req.body;
  if (!type || !date || value === undefined || !unit) {
    return res.status(400).json({ error: "type, date, value, unit are required" });
  }
  const test = await prisma.fitnessTest.create({
    data: { type, date: new Date(date), value: Number(value), unit, notes },
  });
  res.status(201).json(test);
});

router.delete("/:id", async (req, res) => {
  await prisma.fitnessTest.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

module.exports = router;

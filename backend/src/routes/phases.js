const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const phases = await prisma.phase.findMany({
    orderBy: { order: "asc" },
    include: { weeks: { orderBy: { weekNumber: "asc" } } },
  });
  res.json(phases);
});

// Reference "template" week for a phase: the plan's own middle week, sessions included.
router.get("/:order/template", async (req, res) => {
  const order = Number(req.params.order);
  const phase = await prisma.phase.findUnique({ where: { order }, include: { weeks: { orderBy: { weekNumber: "asc" } } } });
  if (!phase) return res.status(404).json({ error: "Phase not found" });
  const midWeek = phase.weeks[Math.floor(phase.weeks.length / 2)];
  const week = await prisma.week.findUnique({
    where: { weekNumber: midWeek.weekNumber },
    include: { sessions: { orderBy: [{ date: "asc" }, { order: "asc" }] } },
  });
  res.json({ phase, templateWeek: week });
});

module.exports = router;

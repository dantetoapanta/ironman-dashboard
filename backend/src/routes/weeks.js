const express = require("express");
const prisma = require("../lib/prisma");
const { todayUTCMidnight } = require("../lib/dates");

const router = express.Router();

function withCompliance(week) {
  const total = week.sessions.filter((s) => s.discipline !== "RACE").length;
  const done = week.sessions.filter((s) => s.discipline !== "RACE" && s.completion?.completed).length;
  return {
    ...week,
    completionPct: total === 0 ? 0 : Math.round((done / total) * 100),
    completedCount: done,
    totalCount: total,
  };
}

router.get("/", async (req, res) => {
  const weeks = await prisma.week.findMany({
    include: { phase: true, sessions: { include: { completion: true }, orderBy: [{ date: "asc" }, { order: "asc" }] } },
    orderBy: { weekNumber: "asc" },
  });
  res.json(weeks.map(withCompliance));
});

router.get("/current", async (req, res) => {
  const today = todayUTCMidnight();
  const week = await prisma.week.findFirst({
    where: { startDate: { lte: today }, endDate: { gte: today } },
    include: { phase: true, sessions: { include: { completion: true }, orderBy: [{ date: "asc" }, { order: "asc" }] } },
  });
  if (!week) return res.status(404).json({ error: "No week found for today's date" });
  res.json(withCompliance(week));
});

router.get("/:weekNumber", async (req, res) => {
  const weekNumber = Number(req.params.weekNumber);
  const week = await prisma.week.findUnique({
    where: { weekNumber },
    include: { phase: true, sessions: { include: { completion: true }, orderBy: [{ date: "asc" }, { order: "asc" }] } },
  });
  if (!week) return res.status(404).json({ error: "Week not found" });
  res.json(withCompliance(week));
});

module.exports = router;

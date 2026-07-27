const express = require("express");
const prisma = require("../lib/prisma");
const { todayUTCMidnight } = require("../lib/dates");

const router = express.Router();

function startOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setUTCHours(23, 59, 59, 999);
  return x;
}

router.get("/today", async (req, res) => {
  const today = req.query.date ? new Date(req.query.date) : todayUTCMidnight();
  const sessions = await prisma.session.findMany({
    where: { date: { gte: startOfDay(today), lte: endOfDay(today) } },
    include: { completion: true, week: { include: { phase: true } } },
    orderBy: { order: "asc" },
  });
  res.json(sessions);
});

router.get("/range", async (req, res) => {
  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: "start and end query params required" });
  const sessions = await prisma.session.findMany({
    where: { date: { gte: startOfDay(new Date(start)), lte: endOfDay(new Date(end)) } },
    include: { completion: true },
    orderBy: [{ date: "asc" }, { order: "asc" }],
  });
  res.json(sessions);
});

router.patch("/:id/complete", async (req, res) => {
  const sessionId = Number(req.params.id);
  const { completed, notes } = req.body;

  const completion = await prisma.completion.upsert({
    where: { sessionId },
    update: { completed: !!completed, completedAt: completed ? new Date() : null, notes },
    create: { sessionId, completed: !!completed, completedAt: completed ? new Date() : null, notes },
  });
  res.json(completion);
});

module.exports = router;

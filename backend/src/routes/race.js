const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/profile", async (req, res) => {
  const profile = await prisma.raceProfile.findFirst();
  if (!profile) return res.status(404).json({ error: "No race profile configured" });
  res.json({ ...profile, splitGoals: profile.splitGoals ? JSON.parse(profile.splitGoals) : null });
});

router.patch("/profile", async (req, res) => {
  const existing = await prisma.raceProfile.findFirst();
  if (!existing) return res.status(404).json({ error: "No race profile configured" });
  const { raceName, raceDate, location, bibNumber, swimDistance, bikeDistance, runDistance, courseNotes, splitGoals, nutritionPlan } = req.body;
  const data = {};
  if (raceName !== undefined) data.raceName = raceName;
  if (raceDate !== undefined) data.raceDate = new Date(raceDate);
  if (location !== undefined) data.location = location;
  if (bibNumber !== undefined) data.bibNumber = bibNumber;
  if (swimDistance !== undefined) data.swimDistance = swimDistance;
  if (bikeDistance !== undefined) data.bikeDistance = bikeDistance;
  if (runDistance !== undefined) data.runDistance = runDistance;
  if (courseNotes !== undefined) data.courseNotes = courseNotes;
  if (splitGoals !== undefined) data.splitGoals = JSON.stringify(splitGoals);
  if (nutritionPlan !== undefined) data.nutritionPlan = nutritionPlan;

  const updated = await prisma.raceProfile.update({ where: { id: existing.id }, data });
  res.json({ ...updated, splitGoals: updated.splitGoals ? JSON.parse(updated.splitGoals) : null });
});

router.get("/morning", async (req, res) => {
  const events = await prisma.raceMorningEvent.findMany({ orderBy: { order: "asc" } });
  res.json(events);
});

router.patch("/morning/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { done, time, label, detail } = req.body;
  const data = {};
  if (done !== undefined) data.done = done;
  if (time !== undefined) data.time = time;
  if (label !== undefined) data.label = label;
  if (detail !== undefined) data.detail = detail;
  const event = await prisma.raceMorningEvent.update({ where: { id }, data });
  res.json(event);
});

module.exports = router;

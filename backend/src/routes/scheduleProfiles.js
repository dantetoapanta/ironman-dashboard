const express = require("express");
const prisma = require("../lib/prisma");

const router = express.Router();

router.get("/", async (req, res) => {
  const profiles = await prisma.scheduleProfile.findMany({ orderBy: { id: "asc" } });
  res.json(profiles.map((p) => ({ ...p, blocks: JSON.parse(p.blocks) })));
});

// Auto-detect: prefer a profile whose date range contains today; fall back to the manually flagged active one.
router.get("/active", async (req, res) => {
  const today = new Date();
  const profiles = await prisma.scheduleProfile.findMany();
  let match = profiles.find((p) => p.startDate && p.endDate && p.startDate <= today && p.endDate >= today);
  if (!match) match = profiles.find((p) => p.active);
  if (!match) return res.status(404).json({ error: "No schedule profile configured" });
  res.json({ ...match, blocks: JSON.parse(match.blocks) });
});

router.patch("/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { name, active, startDate, endDate, blocks } = req.body;
  const data = {};
  if (name !== undefined) data.name = name;
  if (active !== undefined) data.active = active;
  if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
  if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
  if (blocks !== undefined) data.blocks = JSON.stringify(blocks);

  const updated = await prisma.scheduleProfile.update({ where: { id }, data });
  res.json({ ...updated, blocks: JSON.parse(updated.blocks) });
});

module.exports = router;

require("dotenv").config({ quiet: true });
// All week/session dates are stored as UTC-midnight calendar dates. Pin the
// process timezone to the athlete's actual location (Tampa/Eastern) so
// server-local "today" lines up with their real calendar day, not the host's.
process.env.TZ = process.env.APP_TZ || "America/New_York";
const path = require("path");
const express = require("express");
const cors = require("cors");

const weeksRouter = require("./routes/weeks");
const sessionsRouter = require("./routes/sessions");
const phasesRouter = require("./routes/phases");
const fitnessTestsRouter = require("./routes/fitnessTests");
const scheduleProfilesRouter = require("./routes/scheduleProfiles");
const weatherRouter = require("./routes/weather");
const gearRouter = require("./routes/gear");
const raceRouter = require("./routes/race");
const integrationsRouter = require("./routes/integrations");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.use("/api/weeks", weeksRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/phases", phasesRouter);
app.use("/api/fitness-tests", fitnessTestsRouter);
app.use("/api/schedule-profiles", scheduleProfilesRouter);
app.use("/api/weather", weatherRouter);
app.use("/api/gear", gearRouter);
app.use("/api/race", raceRouter);
app.use("/api/integrations", integrationsRouter);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// In production, serve the built frontend and let it handle client-side routes.
const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(frontendDist, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

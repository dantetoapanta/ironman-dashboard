-- CreateTable
CREATE TABLE "Phase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startWeek" INTEGER NOT NULL,
    "endWeek" INTEGER NOT NULL,
    "description" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Week" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekNumber" INTEGER NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "phaseId" INTEGER NOT NULL,
    "runMileage" REAL,
    "bikeMileage" REAL,
    "swimYards" INTEGER,
    "focus" TEXT,
    CONSTRAINT "Week_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "Phase" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "discipline" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "details" TEXT,
    "durationMin" INTEGER,
    "distanceMi" REAL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Session_weekId_fkey" FOREIGN KEY ("weekId") REFERENCES "Week" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Completion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sessionId" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "notes" TEXT,
    CONSTRAINT "Completion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FitnessTest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "ScheduleProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "blocks" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "GearItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "packed" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "RaceProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "raceName" TEXT NOT NULL,
    "raceDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "bibNumber" TEXT,
    "swimDistance" TEXT,
    "bikeDistance" TEXT,
    "runDistance" TEXT,
    "courseNotes" TEXT,
    "splitGoals" TEXT
);

-- CreateTable
CREATE TABLE "RaceMorningEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0
);

-- CreateIndex
CREATE UNIQUE INDEX "Phase_order_key" ON "Phase"("order");

-- CreateIndex
CREATE UNIQUE INDEX "Week_weekNumber_key" ON "Week"("weekNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Completion_sessionId_key" ON "Completion"("sessionId");

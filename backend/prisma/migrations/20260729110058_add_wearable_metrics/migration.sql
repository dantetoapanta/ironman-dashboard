-- CreateTable
CREATE TABLE "WearableConnection" (
    "id" SERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSyncedAt" TIMESTAMP(3),

    CONSTRAINT "WearableConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyMetric" (
    "id" SERIAL NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "whoopRecoveryScore" DOUBLE PRECISION,
    "whoopHrvMilli" DOUBLE PRECISION,
    "whoopRestingHr" DOUBLE PRECISION,
    "whoopSleepScore" DOUBLE PRECISION,
    "whoopSleepHours" DOUBLE PRECISION,
    "whoopStrain" DOUBLE PRECISION,
    "garminSteps" INTEGER,
    "garminRestingHr" DOUBLE PRECISION,
    "garminBodyBattery" DOUBLE PRECISION,
    "garminTrainingLoad" DOUBLE PRECISION,
    "garminSleepHours" DOUBLE PRECISION,
    "garminCalories" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WearableConnection_provider_key" ON "WearableConnection"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "DailyMetric_date_key" ON "DailyMetric"("date");

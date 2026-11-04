-- AlterTable
ALTER TABLE "DailyMetric" ADD COLUMN     "garminHrv" DOUBLE PRECISION,
ADD COLUMN     "garminSleepScore" DOUBLE PRECISION,
ADD COLUMN     "garminStress" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "GarminActivity" (
    "id" SERIAL NOT NULL,
    "garminId" TEXT NOT NULL,
    "name" TEXT,
    "typeKey" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "startLocal" TEXT,
    "durationSec" DOUBLE PRECISION,
    "distanceMeter" DOUBLE PRECISION,
    "avgHr" DOUBLE PRECISION,
    "maxHr" DOUBLE PRECISION,
    "calories" DOUBLE PRECISION,
    "trainingLoad" DOUBLE PRECISION,
    "aerobicEffect" DOUBLE PRECISION,
    "anaerobicEffect" DOUBLE PRECISION,
    "avgPower" DOUBLE PRECISION,
    "elevationGainM" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GarminActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GarminActivity_garminId_key" ON "GarminActivity"("garminId");

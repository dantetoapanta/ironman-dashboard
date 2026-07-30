-- CreateTable
CREATE TABLE "WhoopWorkout" (
    "id" SERIAL NOT NULL,
    "whoopId" TEXT NOT NULL,
    "sportName" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER,
    "strain" DOUBLE PRECISION,
    "avgHr" DOUBLE PRECISION,
    "maxHr" DOUBLE PRECISION,
    "kilojoule" DOUBLE PRECISION,
    "distanceMeter" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WhoopWorkout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WhoopWorkout_whoopId_key" ON "WhoopWorkout"("whoopId");

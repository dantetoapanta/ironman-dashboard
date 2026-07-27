-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RaceMorningEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "time" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "detail" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "done" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_RaceMorningEvent" ("detail", "id", "label", "order", "time") SELECT "detail", "id", "label", "order", "time" FROM "RaceMorningEvent";
DROP TABLE "RaceMorningEvent";
ALTER TABLE "new_RaceMorningEvent" RENAME TO "RaceMorningEvent";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

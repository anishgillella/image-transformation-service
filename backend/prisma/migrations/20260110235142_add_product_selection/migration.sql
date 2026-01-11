-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetPlatforms" TEXT NOT NULL,
    "style" TEXT,
    "customInstructions" TEXT,
    "selectedProducts" TEXT,
    "includeBrandAd" BOOLEAN NOT NULL DEFAULT true,
    "brandProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Campaign" ("brandProfileId", "createdAt", "customInstructions", "description", "id", "name", "status", "style", "targetPlatforms", "updatedAt") SELECT "brandProfileId", "createdAt", "customInstructions", "description", "id", "name", "status", "style", "targetPlatforms", "updatedAt" FROM "Campaign";
DROP TABLE "Campaign";
ALTER TABLE "new_Campaign" RENAME TO "Campaign";
CREATE INDEX "Campaign_brandProfileId_idx" ON "Campaign"("brandProfileId");
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

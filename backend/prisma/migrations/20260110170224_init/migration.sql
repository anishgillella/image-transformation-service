-- CreateTable
CREATE TABLE "BrandProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "personality" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,
    "secondaryColor" TEXT NOT NULL,
    "accentColor" TEXT NOT NULL,
    "targetAudience" TEXT NOT NULL,
    "voiceTone" TEXT NOT NULL,
    "visualStyle" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "uniqueSellingPoints" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "analyzedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "targetPlatforms" TEXT NOT NULL,
    "style" TEXT,
    "customInstructions" TEXT,
    "brandProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Campaign_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "style" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "cta" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "productName" TEXT,
    "productIndex" INTEGER,
    "hasProductImage" BOOLEAN NOT NULL DEFAULT false,
    "productImageUrl" TEXT,
    "imagePrompt" TEXT,
    "brandProfileId" TEXT NOT NULL,
    "campaignId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Ad_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Ad_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdExport" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "platform" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'png',
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "adId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdExport_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BrandAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "format" TEXT,
    "brandProfileId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BrandAsset_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "service" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "cost" REAL NOT NULL,
    "details" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "BrandProfile_companyName_idx" ON "BrandProfile"("companyName");

-- CreateIndex
CREATE INDEX "Campaign_brandProfileId_idx" ON "Campaign"("brandProfileId");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE INDEX "Ad_brandProfileId_idx" ON "Ad"("brandProfileId");

-- CreateIndex
CREATE INDEX "Ad_campaignId_idx" ON "Ad"("campaignId");

-- CreateIndex
CREATE INDEX "Ad_style_idx" ON "Ad"("style");

-- CreateIndex
CREATE INDEX "AdExport_adId_idx" ON "AdExport"("adId");

-- CreateIndex
CREATE UNIQUE INDEX "AdExport_adId_platform_key" ON "AdExport"("adId", "platform");

-- CreateIndex
CREATE INDEX "BrandAsset_brandProfileId_idx" ON "BrandAsset"("brandProfileId");

-- CreateIndex
CREATE INDEX "BrandAsset_type_idx" ON "BrandAsset"("type");

-- CreateIndex
CREATE INDEX "CostEntry_service_idx" ON "CostEntry"("service");

-- CreateIndex
CREATE INDEX "CostEntry_createdAt_idx" ON "CostEntry"("createdAt");

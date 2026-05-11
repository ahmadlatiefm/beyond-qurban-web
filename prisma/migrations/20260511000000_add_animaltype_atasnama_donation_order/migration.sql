-- AlterTable
ALTER TABLE "Order" ADD COLUMN "animalType" TEXT NOT NULL DEFAULT 'domba';

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "animalType" TEXT NOT NULL DEFAULT 'domba',
ADD COLUMN "atasNama" TEXT;

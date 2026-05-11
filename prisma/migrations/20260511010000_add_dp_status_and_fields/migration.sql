-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'DP';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "jumlahDP" INTEGER,
ADD COLUMN "sisaPembayaran" INTEGER;

-- AlterTable
ALTER TABLE "Donation" ADD COLUMN "jumlahDP" INTEGER,
ADD COLUMN "sisaPembayaran" INTEGER;

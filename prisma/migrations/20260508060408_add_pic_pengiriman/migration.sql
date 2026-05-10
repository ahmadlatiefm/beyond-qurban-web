-- AlterTable
ALTER TABLE "Pengiriman" ADD COLUMN     "picId" TEXT;

-- CreateTable
CREATE TABLE "PICPengiriman" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noTelepon" TEXT NOT NULL,
    "keterangan" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PICPengiriman_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pengiriman_picId_idx" ON "Pengiriman"("picId");

-- AddForeignKey
ALTER TABLE "Pengiriman" ADD CONSTRAINT "Pengiriman_picId_fkey" FOREIGN KEY ("picId") REFERENCES "PICPengiriman"("id") ON DELETE SET NULL ON UPDATE CASCADE;

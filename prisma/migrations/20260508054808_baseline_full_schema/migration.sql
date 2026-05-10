-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "QurbanLocation" AS ENUM ('INDONESIA', 'AFRICA', 'PALESTINE');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('ONE_UMMAH', 'HOME_DELIVERY');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'PAID', 'EXPIRED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "price" INTEGER NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "images" TEXT[],
    "badge" TEXT,
    "category" TEXT,
    "qurbanLocation" "QurbanLocation" NOT NULL DEFAULT 'INDONESIA',
    "allowHomeDelivery" BOOLEAN NOT NULL DEFAULT true,
    "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "deliveryMethod" "DeliveryMethod" NOT NULL,
    "qurbanLocation" "QurbanLocation" NOT NULL,
    "address" TEXT,
    "kelurahan" TEXT,
    "kecamatan" TEXT,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "deliveryNotes" TEXT,
    "sacrificeDate" TIMESTAMP(3) NOT NULL,
    "deliveryDate" TIMESTAMP(3),
    "notes" TEXT,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "shippingCost" INTEGER NOT NULL DEFAULT 0,
    "totalAmount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "tripayReference" TEXT,
    "tripayPaymentUrl" TEXT,
    "paymentProofUrl" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" "QurbanLocation" NOT NULL,
    "targetCount" INTEGER NOT NULL,
    "price" INTEGER,
    "imageUrl" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "richContent" TEXT,
    "animalType" TEXT NOT NULL DEFAULT 'domba',
    "programType" TEXT NOT NULL DEFAULT 'qurban',
    "ctaButtonText" TEXT,
    "allowShare" BOOLEAN NOT NULL DEFAULT false,
    "animals" TEXT,
    "gallery" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "videoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pengiriman" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "namaPemesan" TEXT,
    "noWhatsapp" TEXT NOT NULL,
    "alamatLengkap" TEXT,
    "kecamatan" TEXT,
    "kota" TEXT,
    "gmapsPin" TEXT,
    "catatan" TEXT,
    "jenisHewan" TEXT NOT NULL DEFAULT 'Domba',
    "jumlahHewan" INTEGER NOT NULL DEFAULT 1,
    "beratHewan" TEXT,
    "nomorTagHewan" JSONB NOT NULL DEFAULT '[]',
    "atasNama" TEXT,
    "totalHarga" INTEGER NOT NULL DEFAULT 0,
    "statusBayar" TEXT NOT NULL DEFAULT 'belum_bayar',
    "jumlahDP" INTEGER,
    "sisaPembayaran" INTEGER,
    "metodeBayar" TEXT,
    "tanggalBayar" TIMESTAMP(3),
    "buktiTransfer" TEXT,
    "tanggalKirim" TIMESTAMP(3),
    "jamKirim" TEXT,
    "statusKirim" TEXT NOT NULL DEFAULT 'menunggu_data',
    "namaPengirim" TEXT,
    "noKendaraan" TEXT,
    "fotoSerahTerima" TEXT,
    "formDiisi" BOOLEAN NOT NULL DEFAULT false,
    "formDiisiAt" TIMESTAMP(3),
    "sumber" TEXT NOT NULL DEFAULT 'offline',
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "Pengiriman_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignUpdate" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Donation" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "qurbanName" TEXT,
    "qurbanNames" TEXT,
    "forWhom" TEXT,
    "shareType" TEXT,
    "donationType" TEXT,
    "email" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" INTEGER NOT NULL,
    "paymentMethod" TEXT,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "tripayReference" TEXT,
    "tripayPaymentUrl" TEXT,
    "paymentProofUrl" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Donation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Campaign_slug_key" ON "Campaign"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Pengiriman_token_key" ON "Pengiriman"("token");

-- CreateIndex
CREATE INDEX "Pengiriman_statusKirim_idx" ON "Pengiriman"("statusKirim");

-- CreateIndex
CREATE INDEX "Pengiriman_tanggalKirim_idx" ON "Pengiriman"("tanggalKirim");

-- CreateIndex
CREATE UNIQUE INDEX "Donation_orderNumber_key" ON "Donation"("orderNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignUpdate" ADD CONSTRAINT "CampaignUpdate_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

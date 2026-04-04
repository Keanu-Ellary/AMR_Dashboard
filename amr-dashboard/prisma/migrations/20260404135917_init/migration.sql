-- CreateTable
CREATE TABLE "AdminUser" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL,

    CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

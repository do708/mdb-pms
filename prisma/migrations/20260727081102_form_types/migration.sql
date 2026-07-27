-- CreateTable
CREATE TABLE "FormType" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FormType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkorderForm" (
    "id" TEXT NOT NULL,
    "workorderId" TEXT NOT NULL,
    "formTypeId" TEXT NOT NULL,
    "formData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkorderForm_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FormType_key_key" ON "FormType"("key");

-- CreateIndex
CREATE UNIQUE INDEX "WorkorderForm_workorderId_formTypeId_key" ON "WorkorderForm"("workorderId", "formTypeId");

-- AddForeignKey
ALTER TABLE "WorkorderForm" ADD CONSTRAINT "WorkorderForm_workorderId_fkey" FOREIGN KEY ("workorderId") REFERENCES "Workorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkorderForm" ADD CONSTRAINT "WorkorderForm_formTypeId_fkey" FOREIGN KEY ("formTypeId") REFERENCES "FormType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

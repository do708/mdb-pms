-- CreateTable
CREATE TABLE "WorkorderEngineer" (
    "id" TEXT NOT NULL,
    "workorderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WorkorderEngineer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkorderEngineer_workorderId_userId_key" ON "WorkorderEngineer"("workorderId", "userId");

-- AddForeignKey
ALTER TABLE "WorkorderEngineer" ADD CONSTRAINT "WorkorderEngineer_workorderId_fkey" FOREIGN KEY ("workorderId") REFERENCES "Workorder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkorderEngineer" ADD CONSTRAINT "WorkorderEngineer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

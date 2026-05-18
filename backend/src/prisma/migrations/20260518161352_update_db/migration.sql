-- CreateTable
CREATE TABLE "SetDrop" (
    "id" TEXT NOT NULL,
    "setId" TEXT NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SetDrop_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SetDrop_setId_idx" ON "SetDrop"("setId");

-- AddForeignKey
ALTER TABLE "SetDrop" ADD CONSTRAINT "SetDrop_setId_fkey" FOREIGN KEY ("setId") REFERENCES "WorkoutSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

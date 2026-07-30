-- AlterTable
ALTER TABLE "users" ADD COLUMN     "employee_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_employee_number_key" ON "users"("employee_number");

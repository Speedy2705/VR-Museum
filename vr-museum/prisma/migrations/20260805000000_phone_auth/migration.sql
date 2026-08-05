-- Allow accounts created with only a mobile number and make canonical phone
-- numbers safe to use as login identifiers.
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- Existing orders predate online payments and are treated as completed card orders.
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "total" DECIMAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT NOT NULL DEFAULT 'CARD',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentProviderId" TEXT,
    "paymentProviderRef" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_Order" ("id", "userId", "total", "status", "paymentMethod", "paymentStatus", "createdAt")
SELECT "id", "userId", "total", "status", 'CARD',
       CASE WHEN "status" = 'PAID' THEN 'PAID' ELSE 'PENDING' END, "createdAt"
FROM "Order";

DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_paymentProviderId_idx" ON "Order"("paymentProviderId");
CREATE UNIQUE INDEX "Order_paymentProviderRef_key" ON "Order"("paymentProviderRef");

CREATE TABLE "PaymentWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "receivedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "PaymentWebhookEvent_provider_idx" ON "PaymentWebhookEvent"("provider");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

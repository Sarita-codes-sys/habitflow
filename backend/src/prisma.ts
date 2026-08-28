import { PrismaClient } from '@prisma/client';

// Fix BigInt serialization for res.json()
(BigInt.prototype as any).toJSON = function () {
  return Number(this);
};

export const prisma = new PrismaClient();

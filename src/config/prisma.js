const { PrismaClient } = require('@prisma/client');

// Singleton do Prisma Client, reaproveitado em toda a aplicacao.
const prisma = new PrismaClient();

module.exports = prisma;

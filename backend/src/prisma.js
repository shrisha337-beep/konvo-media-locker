const { PrismaClient } = require('@prisma/client');

module.exports = new PrismaClient(); // one instance, reused everywhere via require() caching

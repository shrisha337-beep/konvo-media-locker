const express = require('express');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { walletBalance: true } });
  res.json({ walletBalance: user.walletBalance });
});

router.get('/transactions', requireAuth, async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transactions);
});

module.exports = router;

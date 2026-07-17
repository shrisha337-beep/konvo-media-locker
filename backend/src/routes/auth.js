const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');

const router = express.Router();

// Same token shape used by both endpoints below - one place to change if the payload ever changes.
function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const hashedPassword = await bcrypt.hash(password, 10); // 10 salt rounds - standard bcrypt cost
  const user = await prisma.user.create({ data: { email, password: hashedPassword } });
  // walletBalance defaults to 100 via the schema, no need to set it here

  res.status(201).json({ token: signToken(user.id), walletBalance: user.walletBalance });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  // Same error message for "no such user" and "wrong password" -
  // prevents an attacker from using this endpoint to check which emails are registered.
  const valid = user && (await bcrypt.compare(password, user.password));
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  res.json({ token: signToken(user.id), walletBalance: user.walletBalance });
});

module.exports = router;

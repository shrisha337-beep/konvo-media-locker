const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { randomUUID } = require('crypto');
const prisma = require('../prisma');
const requireAuth = require('../middleware/auth');

const router = express.Router();

// Files land in memory, not on disk, so we can hand the same buffer to sharp (preview)
// and to fs (original) without an extra disk round-trip.
const upload = multer({ storage: multer.memoryStorage() });

const ORIGINALS_DIR = path.join(__dirname, '../storage/originals');
const PREVIEWS_DIR = path.join(__dirname, '../storage/previews');

// --- Upload ---------------------------------------------------------------
router.post('/upload', requireAuth, upload.single('image'), async (req, res) => {
  const price = Number(req.body.price);
  if (!req.file || !Number.isInteger(price) || price < 0) {
    return res.status(400).json({ error: 'image file and a non-negative integer price are required' });
  }

  const filename = `${randomUUID()}.jpg`; // same filename used in both folders, easy to correlate

  await sharp(req.file.buffer).jpeg().toFile(path.join(ORIGINALS_DIR, filename)); // full quality, private
  await sharp(req.file.buffer).resize(300).blur(12).jpeg({ quality: 60 }).toFile(path.join(PREVIEWS_DIR, filename)); // small + blurred, public

  const media = await prisma.media.create({
    data: { ownerId: req.userId, price, previewPath: filename, originalPath: filename },
  });

  res.status(201).json({ id: media.id, previewUrl: `/previews/${filename}`, price: media.price });
});

// --- Feed -------------------------------------------------------------------
router.get('/feed', requireAuth, async (req, res) => {
  const [allMedia, myPurchases] = await Promise.all([
    prisma.media.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.purchase.findMany({ where: { userId: req.userId }, select: { mediaId: true } }),
  ]);
  const unlockedIds = new Set(myPurchases.map((p) => p.mediaId)); // O(1) lookup below instead of scanning the array per media item

  // originalPath is deliberately never sent to the client here, unlocked or not -
  // the client always fetches the real file through GET /:id/original, which re-checks access server-side.
  const feed = allMedia.map((m) => ({
    id: m.id,
    price: m.price,
    previewUrl: `/previews/${m.previewPath}`,
    isOwner: m.ownerId === req.userId,
    isUnlocked: m.ownerId === req.userId || unlockedIds.has(m.id),
  }));

  res.json(feed);
});

// --- Unlock -------------------------------------------------------------------
router.post('/:id/unlock', requireAuth, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) return res.status(404).json({ error: 'Media not found' });
  if (media.ownerId === req.userId) return res.status(400).json({ error: 'You already own this media' });

  try {
    // $transaction makes the balance check + deduction + purchase record atomic:
    // two simultaneous unlock requests from the same user can't both succeed and double-spend.
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: req.userId } });
      if (user.walletBalance < media.price) throw new Error('INSUFFICIENT_FUNDS');

      await tx.user.update({ where: { id: req.userId }, data: { walletBalance: { decrement: media.price } } });
      await tx.purchase.create({ data: { userId: req.userId, mediaId: media.id } });
      await tx.transaction.create({ data: { userId: req.userId, amount: -media.price, mediaId: media.id } });
    });

    res.json({ success: true });
  } catch (err) {
    if (err.message === 'INSUFFICIENT_FUNDS') return res.status(402).json({ error: 'Not enough coins' });
    if (err.code === 'P2002') return res.status(409).json({ error: 'Already unlocked' }); // Purchase @@unique hit
    throw err;
  }
});

// --- Secure original delivery -------------------------------------------------
router.get('/:id/original', requireAuth, async (req, res) => {
  const media = await prisma.media.findUnique({ where: { id: req.params.id } });
  if (!media) return res.status(404).json({ error: 'Media not found' });

  const owns = media.ownerId === req.userId;
  const purchased = owns || (await prisma.purchase.findUnique({
    where: { userId_mediaId: { userId: req.userId, mediaId: media.id } }, // matches the @@unique index name Prisma generates
  }));
  if (!purchased) return res.status(403).json({ error: 'Unlock this media first' });

  res.sendFile(path.join(ORIGINALS_DIR, media.originalPath)); // path is server-controlled (from DB), never built from raw user input
});

module.exports = router;

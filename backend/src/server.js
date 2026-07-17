require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const mediaRoutes = require('./routes/media');
const walletRoutes = require('./routes/wallet');

const app = express();

app.use(cors()); // RN app runs from a different origin (the device/emulator), needs this to call the API
app.use(express.json());

// Previews are intentionally the ONLY files served statically - they're the "safe to leak" copies.
// There is no equivalent express.static() line for /storage/originals anywhere in this file, on purpose.
app.use('/previews', express.static(path.join(__dirname, 'storage/previews')));

app.use('/api/auth', authRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/wallet', walletRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' })); // lets Render's health check + you confirm the server is alive

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

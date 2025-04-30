// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy endpoint
app.get('/api/elevation', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        const response = await axios.get(`https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lon}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

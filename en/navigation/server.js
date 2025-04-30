const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();

// Serve static files from /en/navigation/
app.use('/en/navigation', express.static(path.join(__dirname, 'en', 'navigation')));

// API endpoint under /en/navigation/
app.get('/en/navigation/api/elevation', async (req, res) => {
    const { lat, lon } = req.query;
    try {
        const response = await axios.get(
            `https://api.opentopodata.org/v1/srtm30m?locations=${lat},${lon}`
        );
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch elevation data" });
    }
});

// Handle all other routes (optional)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'en', 'navigation', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

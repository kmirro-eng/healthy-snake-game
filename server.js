const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Healthy Snake Game is running!' });
});

app.listen(PORT, () => {
    console.log(`🍎 Healthy Snake Game running on port ${PORT}`);
    console.log(`🎮 Visit: http://localhost:${PORT}`);
});

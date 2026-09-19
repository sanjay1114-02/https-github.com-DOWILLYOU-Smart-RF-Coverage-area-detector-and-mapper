const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'readings.json');

app.use(cors());
app.use(express.json());

// Serves all files in the public folder (index.html)
app.use(express.static(path.join(__dirname, 'public')));

// Ensure local data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Endpoint to receive readings from ESP32 or manual UI inputs
app.post('/api/readings', (req, res) => {
    const { lat, lng, rssi, timestamp } = req.body;
    
    if (lat === undefined || lng === undefined || rssi === undefined) {
        return res.status(400).json({ error: 'Missing lat, lng, or rssi' });
    }

    const newReading = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        rssi: parseFloat(rssi),
        timestamp: timestamp || new Date().toISOString()
    };

    const fileData = JSON.parse(fs.readFileSync(DATA_FILE));
    fileData.push(newReading);
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2));

    console.log('Saved Reading:', newReading);
    res.status(201).json({ status: 'Success', reading: newReading });
});

// Endpoint to fetch stored readings for the dashboard
app.get('/api/readings', (req, res) => {
    const fileData = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(fileData);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
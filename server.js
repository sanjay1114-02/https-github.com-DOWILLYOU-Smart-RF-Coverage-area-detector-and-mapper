const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'readings.json');

app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Ensure local data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Safe Helper to read JSON file without crashing server
function readReadingsFromFile() {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return content ? JSON.parse(content) : [];
    } catch (err) {
        console.error("Error reading JSON file, resetting storage...", err);
        return [];
    }
}

// POST: Endpoint to receive readings from ESP32, Phone, or Web Dashboard
app.post('/api/readings', (req, res) => {
    const { lat, lng, rssi, carrier, timestamp } = req.body;
    
    if (lat === undefined || lng === undefined || rssi === undefined) {
        return res.status(400).json({ error: 'Missing lat, lng, or rssi' });
    }

    const newReading = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        rssi: parseFloat(rssi),
        // Trim carrier or default to ESP32 Prototype
        carrier: (carrier && carrier.trim()) ? carrier.trim() : "ESP32 Prototype",
        timestamp: timestamp || new Date().toISOString()
    };

    const fileData = readReadingsFromFile();
    fileData.push(newReading);
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2));

    console.log('📡 Saved Reading:', newReading);
    res.status(201).json({ status: 'Success', reading: newReading });
});

// GET: Endpoint to fetch stored readings for dashboard
app.get('/api/readings', (req, res) => {
    const fileData = readReadingsFromFile();
    res.json(fileData);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
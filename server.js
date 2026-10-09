const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'readings.json');

app.use(cors());
app.use(express.json());

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'WEB Dashboard.html'));});
// Ensure local data file exists
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper to safely read JSON file
function readReadingsFromFile() {
    try {
        const content = fs.readFileSync(DATA_FILE, 'utf8');
        return content ? JSON.parse(content) : [];
    } catch (err) {
        console.error("Error reading JSON file, resetting storage...", err);
        return [];
    }
}

// POST: Endpoint to receive signal readings from mobile app or web client
app.post('/api/readings', (req, res) => {
    const { lat, lng, rssi, carrier, timestamp } = req.body;
    
    if (lat === undefined || lng === undefined || rssi === undefined) {
        return res.status(400).json({ error: 'Missing lat, lng, or rssi' });
    }

    const newReading = {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        rssi: parseFloat(rssi),
        carrier: (carrier && carrier.trim()) ? carrier.trim() : "Unknown Carrier",
        timestamp: timestamp || new Date().toISOString()
    };

    const fileData = readReadingsFromFile();
    fileData.push(newReading);
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(fileData, null, 2));

    res.status(201).json({ status: 'Success', reading: newReading });
});

// GET: Endpoint to fetch all stored readings
app.get('/api/readings', (req, res) => {
    const fileData = readReadingsFromFile();
    res.json(fileData);
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});
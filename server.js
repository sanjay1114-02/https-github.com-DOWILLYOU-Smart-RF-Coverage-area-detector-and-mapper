const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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

/* GET: Retrieve readings from PostgreSQL */
app.get('/api/readings', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                id,
                lat,
                lng,
                rssi,
                carrier,
                recorded_at AS timestamp
            FROM public.readings
            ORDER BY recorded_at ASC, id ASC
        `);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching readings:', error);
        res.status(500).json({
            error: 'Failed to fetch readings'
        });
    }
});

/* POST: Save each reading to PostgreSQL */
app.post('/api/readings', async (req, res) => {
    try {
        const { lat, lng, rssi, carrier, timestamp } = req.body;

        if (
            lat === undefined || lat === null || lat === '' ||
            lng === undefined || lng === null || lng === '' ||
            rssi === undefined || rssi === null || rssi === ''
        ) {
            return res.status(400).json({
                error: 'Missing lat, lng, or rssi'
            });
        }

        const latitude = Number(lat);
        const longitude = Number(lng);
        const signal = Number(rssi);

        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude) ||
            !Number.isFinite(signal) ||
            latitude < -90 || latitude > 90 ||
            longitude < -180 || longitude > 180
        ) {
            return res.status(400).json({
                error: 'Invalid latitude, longitude, or RSSI'
            });
        }

        const network =
            typeof carrier === 'string' && carrier.trim()
                ? carrier.trim()
                : 'Unknown Carrier';

        const recordedAt = timestamp || new Date().toISOString();

        const result = await pool.query(
            `INSERT INTO public.readings
                (lat, lng, rssi, carrier, recorded_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING
                id, lat, lng, rssi, carrier,
                recorded_at AS timestamp`,
            [latitude, longitude, signal, network, recordedAt]
        );

        res.status(201).json({
            status: 'Success',
            reading: result.rows[0]
        });
    } catch (error) {
        console.error('Error saving reading:', error);
        res.status(500).json({
            error: 'Failed to save reading'
        });
    }
});

app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on port 3000');
});
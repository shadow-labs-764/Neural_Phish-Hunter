require('dotenv').config(); // Load environment variables immediately
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { logScanResult } = require('./src/config/db'); // Require the database module after dotenv is loaded so process.env is populated
const app = express();
app.use(express.json());

// API Bridge Endpoint
app.post('/api/v1/scan', (req, res) => {
    const { target_url } = req.body;

    if (!target_url) {
        return res.status(400).json({ error: 'Missing target_url in request payload' });
    }

    // Spawn headless Python scanner
    const scriptPath = path.join(__dirname, './ai_engine/scanner.py');
    const pythonProcess = spawn('python3', [scriptPath, target_url]);

    let dataBuffer = '';
    let errorBuffer = '';

    // Intercept stdout
    pythonProcess.stdout.on('data', (data) => {
        dataBuffer += data.toString();
    });

    // Intercept stderr
    pythonProcess.stderr.on('data', (data) => {
        errorBuffer += data.toString();
    });

    // Process termination handler
    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`[!] Scanner execution halted. Code: ${code} | Trace: ${errorBuffer}`);
            try {
                // scanner.py attempts to flush JSON even on handled errors
                const fallbackPayload = JSON.parse(dataBuffer);
                return res.status(500).json(fallbackPayload);
            } catch (e) {
                return res.status(500).json({ 
                    error: 'Scanner execution failed', 
                    trace: errorBuffer || 'Unknown exception'
                });
            }
        }

        try {
            // Parse strict JSON payload from Python stdout
            const resultPayload = JSON.parse(dataBuffer);
            return res.status(200).json(resultPayload);
        } catch (parseError) {
            console.error(`[!] Payload parse failure. Buffer: ${dataBuffer}`);
            return res.status(500).json({ error: 'Malformed payload received from scanner' });
        }
    });
});

// Bind to localhost to enforce routing through reverse proxy / WireGuard
const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`[+] Phish Hunter AI/API Bridge active on 127.0.0.1:${PORT}`);
});
require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const { logScanResult, getTelemetryLogs, verifyOperative } = require('./src/config/db');

const app = express();
app.use(express.json());

// Mount the public surface area (Phases 1-3)
app.use(express.static(path.join(__dirname, 'public')));

// OPSEC Settings
const CLASSIFIED_PASSPHRASE = process.env.OPERATIVE_PASSPHRASE;
const SESSION_TOKEN = "CLANDESTINE-SESSION-TOKEN";

// --- PHASE 3: API BRIDGE ENDPOINT ---
app.post('/api/v1/scan', (req, res) => {
    const { target_url } = req.body;

    if (!target_url) {
        return res.status(400).json({ error: 'Missing url in request payload' });
    }

    const scriptPath = path.join(__dirname, './ai_engine/scanner.py');
    const pythonExecutable = path.join(__dirname, './ai_engine/venv/bin/python');
    const pythonProcess = spawn(pythonExecutable, [scriptPath, target_url]);

    let dataBuffer = '';
    let errorBuffer = '';

    pythonProcess.stdout.on('data', (data) => { dataBuffer += data.toString(); });
    pythonProcess.stderr.on('data', (data) => { errorBuffer += data.toString(); });

    pythonProcess.on('close', async (code) => {
        if (code !== 0) {
            console.error(`[!] Scanner execution halted. Code: ${code} | Trace: ${errorBuffer}`);
            return res.status(500).json({ error: 'Scanner execution failed' });
        }

        try {
            const resultPayload = JSON.parse(dataBuffer);

            // Asynchronously commit to the Vault DB over Tailscale
            logScanResult({
                target_url: target_url,
                threat_status: resultPayload.threat_status,
                confidence: resultPayload.confidence,
                lexical_tokens: resultPayload.lexical_tokens
            }).catch(err => console.error(`[!] Telemetry commit failed: ${err.message}`));

            return res.status(200).json(resultPayload);
        } catch (parseError) {
            console.error(`[!] Payload parse failure. Buffer: ${dataBuffer}`);
            return res.status(500).json({ error: 'Malformed payload received from scanner' });
        }
    });
});

// --- PHASE 4A: GHOST DOM UNLOCK (Secret Code) ---
app.post('/api/v1/auth/ghost', (req, res) => {
    const { passphrase } = req.body;

    if (!passphrase || passphrase !== CLASSIFIED_PASSPHRASE) {
        return res.status(401).json({ error: "AUTHORIZATION FAILED" });
    }

    // Applying the slate/blue aesthetic from the reference image
    const loginCSS = `
        :root, body.dark-theme {
            --bg-body: #0b1121; /* Deep Navy */
            --bg-panel: transparent; 
            --text-main: #f8fafc; /* Pure White */
            --text-muted: #94a3b8;
            --accent-primary: #3b82f6; /* Blue Alert */
            --border-color: #2e3c56;
            --font-terminal: 'Courier New', Courier, monospace;
        }
        body { background-color: var(--bg-body); font-family: var(--font-terminal); color: var(--text-main); }
        .terminal-box { 
            width: 100%; max-width: 520px; margin: 15vh auto; 
            border: 1px solid var(--border-color); 
            padding: 3rem; background: var(--bg-panel); 
        }
        .input-label {
            display: block; margin-bottom: 0.5rem; letter-spacing: 1px;
        }
        input.terminal-input { 
            background: #000000; border: 1px solid #000; border-radius: 6px;
            color: var(--text-main); padding: 0.8rem; width: 100%; 
            margin-bottom: 1.5rem; font-family: var(--font-terminal); outline: none;
        }
        input.terminal-input:focus { border-color: var(--accent-primary); }
        button.terminal-btn { 
            background: #334155; color: var(--text-main); border: none; 
            padding: 0.8rem 1rem; cursor: pointer; font-family: var(--font-terminal); 
            width: 100%; letter-spacing: 1px;
        }
        button.terminal-btn:hover { background: #475569; }
        .threat-alert { color: var(--accent-primary); }
    `;

    const loginHTML = `
        <div class="terminal-box" id="operative-login-view">
            <div style="text-align: center; margin-bottom: 3rem; letter-spacing: 1px;">
                <span class="threat-alert">[!] RESTRICTED SYSTEM</span><br>
                <span>OPERATIVE IDENTIFICATION REQUIRED</span>
            </div>
            <form id="operative-login-form">
                <span class="input-label">ID_CALLSIGN:</span>
                <input type="text" id="op-id" class="terminal-input" required autocomplete="off">
                
                <span class="input-label">PASSPHRASE:</span>
                <input type="password" id="op-pass" class="terminal-input" required>
                
                <button type="submit" class="terminal-btn" id="op-submit">INITIALIZE HANDSHAKE</button>
            </form>
            <div id="op-error" class="threat-alert" style="margin-top: 1rem; text-align: center;"></div>
        </div>
    `;

    res.status(200).json({ status: "UNLOCKED", payload: { css: loginCSS, html: loginHTML } });
});

// --- PHASE 4B: OPERATIVE AUTHENTICATION ---
app.post('/api/v1/auth/operative', async (req, res) => {
    const { opId, opPass } = req.body;

    // Route login through the Zero Trust database
    const isAuthorized = await verifyOperative(opId, opPass);

    if (!isAuthorized) {
        return res.status(401).json({ error: "INVALID CREDENTIALS" });
    }

    // Aggressive Technocrat CSS override injected directly into the dashboard HTML
    const dashboardHTML = `
        <style>
            :root, body, body.dark-theme {
                --bg-body: #000000 !important; 
                --bg-panel: #000000 !important; 
                --text-main: #00ff00 !important; 
                --text-muted: #008800 !important; 
                --accent-primary: #ff0000 !important; 
                --border-color: #00ff00 !important;
                background-color: #000000 !important;
                color: #00ff00 !important;
                background-image: none !important;
                box-shadow: none !important;
                position: relative;
                overflow-x: hidden;
            }

            /* 1. CRT Scanline Overlay */
            body::after {
                content: " ";
                display: block;
                position: absolute;
                top: 0; left: 0; bottom: 0; right: 0;
                background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                            linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
                z-index: 999;
                background-size: 100% 2px, 3px 100%;
                pointer-events: none; /* Allows clicking through the scanlines */
            }

            .vault-container { 
                width: 100%; max-width: 1000px; margin: 2rem auto; 
                border: 1px solid var(--border-color) !important; 
                padding: 2rem; background: #000000 !important; 
                box-shadow: 0 0 15px rgba(0, 255, 0, 0.1) !important;
                position: relative;
                z-index: 10;
            }
            
            /* 2. Chromatic Glitch Animation */
            .system-glitch {
                animation: glitch-anim 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
                color: #ffffff !important;
                text-shadow: 2px 0 var(--accent-primary), -2px 0 blue !important;
            }

            @keyframes glitch-anim {
                0% { transform: translate(0) }
                20% { transform: translate(-2px, 1px) }
                40% { transform: translate(-1px, -1px) }
                60% { transform: translate(2px, 1px) }
                80% { transform: translate(1px, -1px) }
                100% { transform: translate(0) }
            }

            .threat-alert { color: var(--accent-primary) !important; font-weight: bold; text-shadow: 0 0 5px rgba(255,0,0,0.5); }
            .log-table { width: 100%; border-collapse: collapse; text-align: left; }
            .log-table th { padding: 0.5rem; border-bottom: 1px solid var(--border-color) !important; color: var(--text-main) !important; font-weight: bold; }
            .log-table td { padding: 0.5rem; border-bottom: 1px dashed var(--text-muted) !important; }
            .status-threat { color: var(--accent-primary) !important; }
            .status-clean { color: var(--text-main) !important; }
            
            /* --- PHASE 4: DOSSIER EXPANSION CSS --- */
            .primary-row { cursor: pointer; transition: background-color 0.2s ease; }
            .primary-row:hover { background-color: rgba(0, 255, 0, 0.05) !important; }
            
            .dossier-row { display: none; background: #050505; }
            .dossier-row.active { display: table-row; }
            
            .dossier-content {
                padding: 1rem !important;
                border-bottom: 1px dashed var(--accent-primary) !important;
                color: var(--text-main);
                font-size: 0.85rem;
            }
            .dossier-grid { display: flex; flex-direction: column; gap: 0.5rem; }
            .dossier-label { color: var(--text-muted); font-weight: bold; width: 120px; display: inline-block; }
            
            /* --- PHASE 4: IDLE SCREENSAVER CSS --- */
            #hex-screensaver {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background-color: black;
                z-index: 9999;
                display: none; /* Hidden by default */
                pointer-events: none; /* Let the first click pass through to wake up */
            }
            #hex-screensaver.active { display: block; }
        </style>
        <canvas id="hex-screensaver"></canvas>
        <main class="vault-container">
            <header style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center;">
                <h1 class="threat-alert" style="margin: 0; font-size: 1.5rem;">[!] C2 NODE: ACTIVE</h1>
                <span style="border: 1px solid var(--border-color); padding: 0.25rem 0.75rem;">OPERATIVE: ${opId.toUpperCase()}</span>
            </header>
            <div>
                <p style="margin-bottom: 0.5rem;">>_ SECURE MESH LINK ESTABLISHED.</p>
                <p style="margin-bottom: 2rem;">>_ POLLING TELEMETRY...</p>
                <table class="log-table">
                    <thead>
                        <tr>
                            <th>TIME (UTC)</th>
                            <th>TARGET URL</th>
                            <th>STATUS</th>
                            <th>CONF</th>
                        </tr>
                    </thead>
                    <tbody id="telemetry-body">
                        <tr><td colspan="4" style="text-align:center; color: var(--text-muted);">[ AWAITING DATA STREAM ]</td></tr>
                    </tbody>
                </table>
            </div>
        </main>
    `;

    res.status(200).json({ status: "AUTHORIZED", token: SESSION_TOKEN, html: dashboardHTML });
});

// --- PHASE 5: TELEMETRY POLLING ---
app.get('/api/v1/telemetry', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${SESSION_TOKEN}`) {
        return res.status(403).json({ error: "RESTRICTED ACCESS" });
    }

    try {
        const logs = await getTelemetryLogs();
        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '127.0.0.1', () => {
    console.log(`[+] Phish Hunter AI/API Bridge active on 127.0.0.1:${PORT}`);
});

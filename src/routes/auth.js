/**
 * NEURAL PHISH-HUNTER: C2 NODE - GHOST DOM BACKEND
 * Phase 4: Secure Payload Delivery (/api/v1/auth)
 */

const express = require('express');
const router = express.Router();

// OPSEC: In production, this should be an environment variable (process.env.OPERATIVE_PASSPHRASE)
// and ideally hashed (e.g., bcrypt). For Phase 4 implementation, we use a strict string match.
const CLASSIFIED_PASSPHRASE = "ECHO-ACTUAL-99"; 

router.post('/auth', (req, res) => {
    const { passphrase } = req.body;

    // 1. Strict Validation
    if (!passphrase || passphrase !== CLASSIFIED_PASSPHRASE) {
        // Silent failure: return standard 401 without detailing why.
        console.warn(`[!] Unauthorized access attempt on Clandestine Node.`);
        return res.status(401).json({ error: "AUTHORIZATION FAILED" });
    }

    console.log(`[SYS] Operative Authenticated. Compiling Ghost DOM Payload...`);

    // 2. The Technocrat CSS Payload
    // Pure black, monospace, crimson accents, terminal glassmorphism.
    const technocratCSS = `
        :root {
            --bg-body: #000000;
            --bg-panel: rgba(15, 15, 15, 0.9);
            --text-main: #e2e8f0;
            --text-muted: #64748b;
            --accent-primary: #dc2626; /* Crimson Red */
            --accent-hover: #b91c1c;
            --border-color: #333333;
            --shadow-soft: 0 0 20px rgba(220, 38, 38, 0.15);
            --font-terminal: 'Courier New', Courier, monospace;
        }

        body {
            background-color: var(--bg-body);
            font-family: var(--font-terminal);
            color: var(--text-main);
            background-image: 
                linear-gradient(rgba(220, 38, 38, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(220, 38, 38, 0.03) 1px, transparent 1px);
            background-size: 20px 20px;
        }

        .vault-container {
            width: 100%;
            max-width: 900px;
            margin: 2rem auto;
            border: 1px solid var(--accent-primary);
            background: var(--bg-panel);
            backdrop-filter: blur(10px);
            box-shadow: var(--shadow-soft);
            padding: 2rem;
        }

        .vault-header {
            border-bottom: 1px solid var(--accent-primary);
            padding-bottom: 1rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .vault-header h1 {
            color: var(--accent-primary);
            font-size: 1.2rem;
            text-transform: uppercase;
            letter-spacing: 2px;
        }

        .terminal-text {
            color: var(--text-muted);
            font-size: 0.9rem;
            margin-bottom: 1rem;
        }

        .log-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.9rem;
        }

        .log-table th {
            text-align: left;
            padding: 0.75rem;
            border-bottom: 1px dashed var(--border-color);
            color: var(--text-muted);
        }

        .log-table td {
            padding: 0.75rem;
            border-bottom: 1px solid #1a1a1a;
        }

        .status-threat { color: var(--accent-primary); font-weight: bold; }
        .status-clean { color: #10b981; }
        
        .pulse-text {
            animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
    `;

    // 3. The Vault HTML Payload
    // The RAW/Agency Terminal layout.
    const vaultHTML = `
        <main class="vault-container">
            <header class="vault-header">
                <h1>[!] SYSTEM: CLANDESTINE ADMIN</h1>
                <span style="color: var(--text-muted);">NODE: AZURE B2ATS_V2</span>
            </header>
            
            <div class="terminal-body">
                <div class="terminal-text pulse-text">>_ ESTABLISHING SECURE TUNNEL TO TAILSCALE MESH... SUCCESS.</div>
                <div class="terminal-text">>_ FETCHING MYSQL TELEMETRY LOGS...</div>
                
                <table class="log-table" id="telemetry-grid">
                    <thead>
                        <tr>
                            <th>TIMESTAMP</th>
                            <th>TARGET URL</th>
                            <th>STATUS</th>
                            <th>CONF.</th>
                        </tr>
                    </thead>
                    <tbody id="telemetry-body">
                        <!-- JS polling will inject live rows here -->
                        <tr><td colspan="4" style="text-align:center; color: var(--text-muted);">[ INITIALIZING GRID ]</td></tr>
                    </tbody>
                </table>
            </div>
        </main>
    `;

    // 4. Secure Delivery
    res.status(200).json({
        status: "AUTHORIZED",
        payload: {
            css: technocratCSS,
            html: vaultHTML
        }
    });
});

module.exports = router;
const mysql = require('mysql2/promise');

/**
 * Initialize Connection Pool
 * Target: Azure Instance 2 via Tailscale Mesh IP
 * Architecture: Zero-Trust / WireGuard Encrypted
 */
const pool = mysql.createPool({
    host: process.env.TAILSCALE_DB_IP,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

/**
 * Log scan payload to the remote MySQL database
 * @param {Object} payload - The JSON payload from scanner.py
 */
async function logScanResult(payload) {
    const query = `
        INSERT INTO scan_logs (target_url, threat_status, confidence, lexical_tokens, scanned_at)
        VALUES (?, ?, ?, ?, NOW())
    `;

    // Convert the tokens array to a JSON string for database storage
    const tokensJson = JSON.stringify(payload.lexical_tokens);

    try {
        const [result] = await pool.execute(query, [
            payload.target_url,
            payload.threat_status,
            payload.confidence,
            tokensJson
        ]);
        console.log(`[+] Log committed to Instance 2 Mesh DB | Insert ID: ${result.insertId}`);
        return result;
    } catch (error) {
        console.error(`[!] Mesh DB Routing Failure: ${error.message}`);
        throw error;
    }
}

module.exports = {
    pool,
    logScanResult
};
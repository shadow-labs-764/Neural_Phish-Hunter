const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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
 */
async function logScanResult(payload) {
    const query = `
        INSERT INTO scan_logs (url, threat_status, confidence, lexical_tokens, scanned_at)
        VALUES (?, ?, ?, ?, NOW())
    `;

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

/**
 * Extract recent scan logs for the Ghost DOM dashboard
 */
async function getTelemetryLogs() {
    const query = `
        SELECT 
            DATE_FORMAT(scanned_at, '%H:%i:%s UTC') as timestamp,
            url,
            threat_status as status,
            confidence
        FROM scan_logs
        ORDER BY scanned_at DESC
        LIMIT 50
    `;
    try {
        const [rows] = await pool.query(query);
        return rows;
    } catch (error) {
        console.error(`[!] Telemetry Extraction Failure: ${error.message}`);
        throw error;
    }
}

async function verifyOperative(username, password) {
    try {
        const [rows] = await pool.execute('SELECT * FROM operatives WHERE username = ?', [username]);
        if (rows.length === 0) return false;

        const operative = rows[0];
        const isValid = await bcrypt.compare(password, operative.password_hash);

        if (isValid) {
            // Log the successful handshake timestamp
            await pool.execute('UPDATE operatives SET last_login = NOW() WHERE id = ?', [operative.id]);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`[!] Operative Verification Failure: ${error.message}`);
        return false;
    }
}

module.exports = {
    pool,
    logScanResult,
    getTelemetryLogs,
    verifyOperative // Export the newly created function
};


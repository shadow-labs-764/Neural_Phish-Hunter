/**
 * NEURAL PHISH-HUNTER: C2 NODE
 * Phase 5: Telemetry API Endpoint
 */
const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Middleware: Validate Clandestine Session
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // In production, validate a real JWT here. 
    // For this operational phase, we check the hardcoded Bearer token.
    if (!authHeader || authHeader !== 'Bearer CLANDESTINE-SESSION-TOKEN') {
        console.warn('[!] Unauthorized telemetry access attempt intercepted.');
        return res.status(403).json({ error: "RESTRICTED ACCESS" });
    }
    next();
};

// GET /api/v1/telemetry
router.get('/', requireAuth, async (req, res) => {
    try {
        // Query the latest 50 logs. 
        // Adjust table/column names based on your exact MySQL schema.
        const query = `
            SELECT 
                DATE_FORMAT(created_at, '%H:%i:%s UTC') as timestamp,
                target_url,
                threat_status as status,
                confidence_score as confidence
            FROM phish_telemetry_logs
            ORDER BY created_at DESC
            LIMIT 50
        `;
        
        const [rows] = await db.query(query);
        
        res.status(200).json(rows);

    } catch (error) {
        console.error('[!] Telemetry Query Failed:', error.message);
        res.status(500).json({ error: "INTERNAL SERVER ERROR" });
    }
});

module.exports = router;
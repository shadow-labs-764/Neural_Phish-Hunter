/**
 * NEURAL PHISH-HUNTER: CLIENT C2 NODE
 * Synchronized for 2-Stage Ghost DOM Auth
 */
// Phase 1: Intelligence Dictionary
const TOKEN_EXPLANATIONS = {
    'multiple-hyphens': 'Attackers use hyphens to visually mimic legitimate domains (e.g., paypal-update-auth).',
    'brand_spoof': 'Contains keywords of targeted brands often used in credential harvesting.',
    'length_flag': 'Unusually long URLs are often used to hide malicious parameters from the user.',
    'ip_address': 'Legitimate services rarely use raw IP addresses in their URLs.',
    'suspicious_tld': 'Uses a Top-Level Domain (.xyz, .top) heavily associated with disposable phishing infrastructure.'
};

const DOM = {
    gear: document.getElementById('trigger-zone'),
    body: document.body,
    form: document.getElementById('scan-form'),
    input: document.getElementById('target-url'),
    btn: document.getElementById('scan-btn'),
    autopsyOverlay: document.getElementById('autopsy-overlay'),
    settingsMenu: document.getElementById('settings-menu'), 
    themeToggle: document.getElementById('theme-toggle')    
};

const opsec = {
    clicks: 0,
    timer: null,
    isGhostMode: false,
    timeWindow: 1500, 
    triggerCount: 5   
};

// Active Scan State
let activeScanData = null;

// 1. The Cover Action: Boring Menu Theme Toggle
if (DOM.themeToggle) {
    DOM.themeToggle.addEventListener('change', (e) => {
        DOM.body.classList.toggle('dark-theme', e.target.checked);
    });
}

// 2. The Trigger: Menu Toggle vs Pentatap
// 2. The Trigger: Instant Menu Toggle & Pentatap Tracker
DOM.gear.addEventListener('click', (e) => {
    e.preventDefault();
    
    opsec.clicks++;

    if (opsec.clicks === 1) {
        // INSTANTLY Toggle the menu immediately on the first click
        if (DOM.settingsMenu) {
            DOM.settingsMenu.classList.toggle('hidden');
        }

        // Start the sequence timer
        opsec.timer = setTimeout(() => {
            opsec.clicks = 0; 
        }, opsec.timeWindow);
    }

    if (opsec.clicks === opsec.triggerCount) {
        // PENTATAP SUCCESS: Clear timer, hide menu, execute Ghost DOM
        clearTimeout(opsec.timer);
        opsec.clicks = 0;
        if (DOM.settingsMenu) DOM.settingsMenu.classList.add('hidden');
        triggerGhostDOMState();
    }
});

function triggerGhostDOMState() {
    if (opsec.isGhostMode) return; 
    
    opsec.isGhostMode = true;
    DOM.body.classList.add('dark-theme');
    
    DOM.input.value = '';
    DOM.input.type = 'password';
    DOM.input.placeholder = '[ AUTHORIZATION REQUIRED ]';
    DOM.input.style.textAlign = 'center';
    DOM.input.style.letterSpacing = '2px';
    DOM.btn.textContent = 'AUTH';
    DOM.autopsyOverlay.classList.add('hidden');
}

DOM.form.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    const payload = DOM.input.value.trim();
    if (!payload) return;

    if (opsec.isGhostMode) {
        executeAuthHandshake(payload);
    } else {
        executeScan(payload);
    }
});

// --- PHASE 3: STANDARD SCAN ---
async function executeScan(url) {
    // 1. INITIALIZE THE PULSE
    const scannerContainer = document.querySelector('.scanner-container');
    scannerContainer.classList.add('scanning-pulse');
    DOM.btn.textContent = 'SCANNING...'; // FIXED: Changed DOM.scanBtn to DOM.btn

    try {
        const response = await fetch('/api/v1/scan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target_url: url })
        });
        
        const data = await response.json();
        const isThreat = data.threat_status === 'MALICIOUS' || data.threat_status === 'SUSPICIOUS';

        // 2. TERMINATE THE PULSE
        scannerContainer.classList.remove('scanning-pulse');
        DOM.btn.textContent = 'SCAN'; 

        // Set global state for Phase 2 Utilities
        activeScanData = { 
            url: url, 
            status: data.threat_status, 
            confidence: data.confidence, 
            tokens: data.lexical_tokens 
        };

        // Reveal the overlay container immediately
        DOM.autopsyOverlay.classList.remove('hidden');

        const statusElement = document.getElementById('threat-status');
        statusElement.textContent = data.threat_status;
        
        const colorVar = isThreat ? 'var(--threat-color)' : 'var(--safe-color)';
        
        statusElement.style.color = colorVar;
        document.getElementById('confidence-score').textContent = `${data.confidence.toFixed(1)}%`;
        
        // FIXED: Added DOM selection for the progress bar
        setTimeout(() => {
            const progressBarFill = document.querySelector('.progress-fill'); // Adjust selector to match your HTML
            if (progressBarFill) {
                progressBarFill.style.width = `${data.confidence}%`;
                progressBarFill.style.backgroundColor = colorVar;
            }
        }, 100);

        // 3. EXECUTE THE REVEAL (Cascading Typing Effect)
        const tokensContainer = document.getElementById('lexical-tokens'); 
        tokensContainer.innerHTML = ''; 

        if (data.lexical_tokens && data.lexical_tokens.length > 0) {
            data.lexical_tokens.forEach((token, index) => {
                const span = document.createElement('span');
                span.textContent = `[ ${token} ]`;
                
                // Attach Tooltip
                if (TOKEN_EXPLANATIONS[token]) {
                    span.setAttribute('data-tooltip', TOKEN_EXPLANATIONS[token]);
                } else {
                    span.setAttribute('data-tooltip', 'Anomalous lexical structure detected.');
                }

                // Apply Color Priority
                if (isThreat) {
                    span.classList.add('token-threat');
                } else {
                    span.classList.add('token-safe');
                }

                tokensContainer.appendChild(span);

                // Staggered Cascade: Delay the reveal based on index
                setTimeout(() => {
                    span.classList.add('revealed');
                }, index * 120); 
            });
        } else {
            // No anomalies state
            const safeSpan = document.createElement('span');
            safeSpan.textContent = '[ No anomalies detected ]';
            safeSpan.classList.add('token-safe', 'revealed');
            safeSpan.style.border = 'none';
            tokensContainer.appendChild(safeSpan);
        }

        // Save to Session History
        saveScanToHistory(url, data.threat_status);

    } catch (error) {
        alert('Scanner API unavailable.');
        console.error('[!] Scan execution failed.', error); // FIXED: Moved inside the catch block
    } finally {
        DOM.btn.textContent = 'SCAN';
        DOM.btn.disabled = false;
        DOM.input.disabled = false;
        DOM.input.focus();
        scannerContainer.classList.remove('scanning-pulse');
    }
}

// --- STAGE 1: GHOST DOM UNLOCK ---
async function executeAuthHandshake(passphrase) {
    DOM.btn.textContent = 'VERIFYING...';
    DOM.btn.disabled = true;
    DOM.input.disabled = true;

    try {
        // PATCH: Routed to /api/v1/auth/ghost to match backend
        const response = await fetch('/api/v1/auth/ghost', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ passphrase: passphrase })
        });

        if (!response.ok) throw new Error("AUTHORIZATION FAILED");

        const data = await response.json();

        if (data.status === "UNLOCKED") {
            const styleElement = document.createElement('style');
            styleElement.type = 'text/css';
            styleElement.innerHTML = data.payload.css;
            document.head.appendChild(styleElement);
            document.body.innerHTML = data.payload.html;
        }

    } catch (error) {
        DOM.input.value = '';
        DOM.btn.textContent = 'AUTH';
        DOM.btn.disabled = false;
        DOM.input.disabled = false;
        DOM.input.focus();
    }
}

// --- STAGE 2: OPERATIVE AUTHENTICATION ---
// Event delegation handles the dynamically injected terminal form
document.addEventListener('submit', async (e) => {
    if (e.target && e.target.id === 'operative-login-form') {
        e.preventDefault();
        
        const opId = document.getElementById('op-id').value;
        const opPass = document.getElementById('op-pass').value;
        const btn = document.getElementById('op-submit');
        const err = document.getElementById('op-error');
        
        btn.textContent = 'AUTHENTICATING...';
        err.textContent = '';

        try {
            const res = await fetch('/api/v1/auth/operative', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ opId, opPass })
            });
            
            if (!res.ok) throw new Error("INVALID CREDENTIALS");
            
            const data = await res.json();
            document.body.innerHTML = data.html; 
            
            // UX Phase 3: Trigger System Boot Sound
            C2Audio.playBoot();

            // Store session token in memory
            window.operativeToken = data.token; 
            initiateLiveTelemetry();
            
        } catch (error) {
            btn.textContent = 'INITIALIZE HANDSHAKE';
            err.textContent = '[!] ACCESS DENIED';
        }
    }
});

// --- INTELLIGENCE POLLING LOOP ---
let telemetryInterval;

function initiateLiveTelemetry() {
    fetchTelemetryData();
    telemetryInterval = setInterval(fetchTelemetryData, 3000);
}
let lastThreatTimestamp = null;
async function fetchTelemetryData() {
    try {
        const response = await fetch('/api/v1/telemetry', {
            headers: { 'Authorization': `Bearer ${window.operativeToken}` }
        });
        if (!response.ok) return;

        const logs = await response.json();
        const tbody = document.getElementById('telemetry-body');
        if (!tbody) return; 
        
        tbody.innerHTML = ''; 
        
        let newThreatDetected = false;

        logs.forEach((log, index) => {
            const isThreat = log.status === 'MALICIOUS' || log.status === 'SUSPICIOUS';
            const statusClass = isThreat ? 'status-threat' : 'status-clean';
            
            // 1. Generate Primary Summary Row
            const primaryTr = document.createElement('tr');
            primaryTr.className = 'primary-row';
            primaryTr.innerHTML = `
                <td>${log.timestamp}</td>
                <td>${log.target_url}</td>
                <td class="${statusClass}">[ ${log.status} ]</td>
                <td>${Number(log.confidence).toFixed(1)}%</td>
            `;
            tbody.appendChild(primaryTr);

            // 2. Generate Hidden Dossier Row
            const dossierTr = document.createElement('tr');
            dossierTr.className = 'dossier-row';
            // Assume the backend sends raw tokens array in the log object. If not, adjust accordingly.
            const tokenList = (log.lexical_tokens && log.lexical_tokens.length > 0) 
                ? log.lexical_tokens.join(', ') 
                : 'None detected';
                
            dossierTr.innerHTML = `
                <td colspan="4" class="dossier-content">
                    <div class="dossier-grid">
                        <div><span class="dossier-label">>_ TARGET IP:</span> [ AWAITING RESOLUTION ]</div>
                        <div><span class="dossier-label">>_ ANOMALIES:</span> [ ${tokenList} ]</div>
                        <div><span class="dossier-label">>_ RAW CONF:</span> ${log.confidence}</div>
                    </div>
                </td>
            `;
            tbody.appendChild(dossierTr);

            if (index === 0 && isThreat && log.timestamp !== lastThreatTimestamp) {
                newThreatDetected = true;
                lastThreatTimestamp = log.timestamp;
            }
        });

        // UX Phase 3: Fire Audiovisual Alert
        if (newThreatDetected) {
            C2Audio.playThreatPing();
            document.body.classList.add('system-glitch');
            
            // Remove glitch after 500ms
            setTimeout(() => {
                document.body.classList.remove('system-glitch');
            }, 500);
        }

    } catch (error) {
        console.error('[!] Telemetry Sync Error.', error);
    }
}

// --- PHASE 1: LOCAL SESSION HISTORY MANAGER ---

function loadHistory() {
    const history = localStorage.getItem('phishHunterHistory');
    return history ? JSON.parse(history) : [];
}

function saveScanToHistory(url, status) {
    const history = loadHistory();
    // Add new scan to the beginning of the array
    history.unshift({ url, status, timestamp: new Date().toLocaleTimeString() });
    
    // Enforce max array length of 5 to keep UI clean
    if (history.length > 5) history.pop();
    
    localStorage.setItem('phishHunterHistory', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (!historyList) return;
    
    const history = loadHistory();
    historyList.innerHTML = '';
    
    if (history.length === 0) {
        historyList.innerHTML = '<li style="color: var(--text-muted); font-size: 0.8rem;">No recent scans.</li>';
        return;
    }

    history.forEach(item => {
        const li = document.createElement('li');
        li.className = 'history-item';
        
        const isThreat = item.status === 'MALICIOUS' || item.status === 'SUSPICIOUS';
        const statusClass = isThreat ? 'threat' : 'safe';
        
        li.innerHTML = `
            <span class="history-url" title="${item.url}">${item.url}</span>
            <span class="history-status ${statusClass}">${item.status}</span>
        `;
        historyList.appendChild(li);
    });
}

// Hook to render history immediately when the page loads
document.addEventListener('DOMContentLoaded', renderHistory);

// --- PHASE 2: DEFANG & EXPORT UTILITIES ---

const btnDefang = document.getElementById('btn-defang');
const btnExport = document.getElementById('btn-export');

// Defang & Copy Protocol
if (btnDefang) {
    btnDefang.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!activeScanData) return;

        // 1. Regex Sanitization
        let safeUrl = activeScanData.url
            .replace(/http/gi, 'hxxp')    // Neutralize protocols
            .replace(/\./g, '[.]');       // Bracket periods

        try {
            // 2. Clipboard API Injection
            await navigator.clipboard.writeText(safeUrl);
            
            // 3. Tactical UI Feedback
            const originalText = btnDefang.textContent;
            btnDefang.textContent = 'COPIED [ SAFE ]';
            btnDefang.style.color = 'var(--safe-color)';
            btnDefang.style.borderColor = 'var(--safe-color)';
            
            setTimeout(() => {
                btnDefang.textContent = originalText;
                btnDefang.style.color = 'var(--text-main)';
                btnDefang.style.borderColor = 'var(--glass-border)';
            }, 2000);
        } catch (err) {
            console.error('[!] Clipboard access denied.', err);
        }
    });
}

// Zero-Dependency Autopsy Export
if (btnExport) {
    btnExport.addEventListener('click', (e) => {
        e.preventDefault();
        if (!activeScanData) return;

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const tokenList = (activeScanData.tokens && activeScanData.tokens.length > 0) 
            ? activeScanData.tokens.join('\n  - ') 
            : 'None detected';

        // 1. Dossier Compilation (Raw Text Format)
        const dossierContent = `
=========================================
NEURAL THREAT DOSSIER
=========================================
TIMESTAMP  : ${new Date().toUTCString()}
TARGET URL : ${activeScanData.url}
STATUS     : ${activeScanData.status}
CONFIDENCE : ${activeScanData.confidence.toFixed(1)}%
=========================================
LEXICAL ANOMALIES:
  - ${tokenList}
=========================================
* Generated by Neural Phish-Hunter Node
=========================================
`.trim();

        // 2. Blob Generation
        const blob = new Blob([dossierContent], { type: 'text/plain' });
        const objectUrl = URL.createObjectURL(blob);
        
        // 3. Silent Download Trigger
        const downloadLink = document.createElement('a');
        downloadLink.href = objectUrl;
        downloadLink.download = `threat_dossier_${timestamp}.txt`;
        downloadLink.style.display = 'none';
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        
        // DOM Cleanup
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(objectUrl);
    });
}
// --- PHASE 3: AUDITORY TELEMETRY (WEB AUDIO API) ---
const C2Audio = {
    ctx: null,
    init() {
        // Lazy initialization to bypass browser autoplay restrictions
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playKeystroke() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.05); // Rapid frequency drop
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    },
    playBoot() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.8); // Low-pass sweep
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.8);
    },
    playThreatPing() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.1); // Sharp ascending ping
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
};

// 1. Bind Keystroke Audio (Event Delegation for injected inputs)
document.addEventListener('keydown', (e) => {
    if (e.target && e.target.classList.contains('terminal-input')) {
        C2Audio.playKeystroke();
    }
});

// --- PHASE 4: TACTICAL ROW EXPANSION ---
document.addEventListener('click', (e) => {
    // Check if a primary row was clicked
    const primaryRow = e.target.closest('.primary-row');
    if (primaryRow) {
        // Find the immediately following dossier row and toggle it
        const dossierRow = primaryRow.nextElementSibling;
        if (dossierRow && dossierRow.classList.contains('dossier-row')) {
            dossierRow.classList.toggle('active');
            C2Audio.playKeystroke(); // Optional auditory feedback on expansion
        }
    }
});

// --- PHASE 4: IDLE HEX DUMP SCREENSAVER ---
const Screensaver = {
    canvas: null,
    ctx: null,
    timeoutId: null,
    idleLimit: 3 * 60 * 1000, // 3 minutes in milliseconds
    animationFrameId: null,
    columns: [],
    fontSize: 16,
    isActive: false,

    init() {
        // Reset timers on any activity
        const resetEvents = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
        resetEvents.forEach(event => {
            window.addEventListener(event, () => this.resetWatchdog());
        });
        this.resetWatchdog();
    },

    resetWatchdog() {
        clearTimeout(this.timeoutId);
        
        if (this.isActive) {
            this.stop();
        }

        // Only arm the screensaver if the operative dashboard is active (window.operativeToken exists)
        if (window.operativeToken) {
            this.timeoutId = setTimeout(() => this.start(), this.idleLimit);
        }
    },

    start() {
        this.canvas = document.getElementById('hex-screensaver');
        if (!this.canvas) return;

        this.isActive = true;
        this.canvas.classList.add('active');
        this.ctx = this.canvas.getContext('2d');
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        const colCount = Math.floor(this.canvas.width / this.fontSize) + 1;
        this.columns = Array(colCount).fill(1); // Start all columns at Y=1

        this.renderFrame();
    },

    stop() {
        this.isActive = false;
        if (this.canvas) this.canvas.classList.remove('active');
        cancelAnimationFrame(this.animationFrameId);
    },

    renderFrame() {
        if (!this.isActive) return;

        // Fading trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#00ff00'; // Matrix green
        this.ctx.font = `${this.fontSize}px monospace`;

        for (let i = 0; i < this.columns.length; i++) {
            // Random Hex Character
            const hexChars = '0123456789ABCDEF';
            const char = hexChars[Math.floor(Math.random() * hexChars.length)];
            
            const x = i * this.fontSize;
            const y = this.columns[i] * this.fontSize;

            this.ctx.fillText(char, x, y);

            // Randomize drop reset to create staggered columns
            if (y > this.canvas.height && Math.random() > 0.975) {
                this.columns[i] = 0;
            }
            this.columns[i]++;
        }

        // Throttle frame rate slightly for classic terminal feel (~30fps)
        setTimeout(() => {
            this.animationFrameId = requestAnimationFrame(() => this.renderFrame());
        }, 33);
    }
};

// Initialize the watchdog immediately
Screensaver.init();
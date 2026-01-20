// Digital Prescription System - Backend API Server
// Handles patient data storage in database
// Doctor data remains in localStorage (handled client-side)

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files (HTML, CSS, JS)
app.use(express.static(__dirname));

// Database setup
const DB_PATH = path.join(__dirname, 'patient_database.db');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.serialize(() => {
        // Patients table
        db.run(`CREATE TABLE IF NOT EXISTS patients (
            id TEXT PRIMARY KEY,
            name TEXT,
            age TEXT,
            gender TEXT,
            conditions TEXT,
            created_at TEXT,
            updated_at TEXT
        )`);

        // Reports table (for diagnostic/blood test reports)
        db.run(`CREATE TABLE IF NOT EXISTS reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            name TEXT NOT NULL,
            size INTEGER,
            type TEXT,
            data_url TEXT,
            extracted_conditions TEXT,
            summary TEXT,
            uploaded_at TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )`);

        // Prescriptions table
        db.run(`CREATE TABLE IF NOT EXISTS prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            patient_name TEXT,
            patient_age TEXT,
            patient_gender TEXT,
            medicines TEXT,
            dietary_advice TEXT,
            general_instructions TEXT,
            follow_up TEXT,
            doctor_id TEXT,
            content TEXT,
            warnings INTEGER,
            doctor_notes TEXT,
            date TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )`);

        console.log('Database tables initialized');
    });
}

// Helper function to parse JSON safely
function safeParseJSON(str, defaultValue = []) {
    try {
        return str ? JSON.parse(str) : defaultValue;
    } catch (e) {
        return defaultValue;
    }
}

// ============================================
// API ENDPOINTS
// ============================================

// Get patient data (including reports and prescriptions)
app.get('/api/patients/:patientId', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();

    db.serialize(() => {
        // Get patient basic info
        db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, patient) => {
            if (err) {
                return res.status(500).json({ error: 'Database error', details: err.message });
            }

            if (!patient) {
                // Patient doesn't exist - return empty structure
                return res.json({
                    id: patientId,
                    name: '',
                    age: '',
                    gender: '',
                    conditions: [],
                    reports: [],
                    prescriptions: [],
                    createdAt: new Date().toISOString()
                });
            }

            // Get reports
            db.all('SELECT * FROM reports WHERE patient_id = ? ORDER BY uploaded_at DESC', [patientId], (err, reports) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error fetching reports', details: err.message });
                }

                // Get prescriptions
                db.all('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date DESC', [patientId], (err, prescriptions) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error fetching prescriptions', details: err.message });
                    }

                    // Format response
                    const patientData = {
                        id: patient.id,
                        name: patient.name || '',
                        age: patient.age || '',
                        gender: patient.gender || '',
                        conditions: safeParseJSON(patient.conditions, []),
                        reports: reports.map(r => ({
                            name: r.name,
                            size: r.size,
                            type: r.type,
                            uploadedAt: r.uploaded_at,
                            extractedConditions: safeParseJSON(r.extracted_conditions, []),
                            dataUrl: r.data_url,
                            summary: r.summary
                        })),
                        prescriptions: prescriptions.map(p => ({
                            patientName: p.patient_name,
                            patientAge: p.patient_age,
                            patientGender: p.patient_gender,
                            medicines: safeParseJSON(p.medicines, []),
                            dietaryAdvice: p.dietary_advice || '',
                            generalInstructions: p.general_instructions || '',
                            followUp: p.follow_up || '',
                            doctorId: p.doctor_id,
                            content: p.content || '',
                            warnings: p.warnings === 1,
                            doctorNotes: p.doctor_notes || '',
                            date: p.date
                        })),
                        createdAt: patient.created_at || new Date().toISOString()
                    };

                    res.json(patientData);
                });
            });
        });
    });
});

// Save/Update patient data
app.post('/api/patients/:patientId', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const { name, age, gender, conditions } = req.body;

    const now = new Date().toISOString();

    db.serialize(() => {
        // Check if patient exists
        db.get('SELECT id FROM patients WHERE id = ?', [patientId], (err, existing) => {
            if (err) {
                return res.status(500).json({ error: 'Database error', details: err.message });
            }

            if (existing) {
                // Update existing patient
                db.run(
                    'UPDATE patients SET name = ?, age = ?, gender = ?, conditions = ?, updated_at = ? WHERE id = ?',
                    [name || '', age || '', gender || '', JSON.stringify(conditions || []), now, patientId],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error updating patient', details: err.message });
                        }
                        res.json({ success: true, message: 'Patient updated' });
                    }
                );
            } else {
                // Create new patient
                db.run(
                    'INSERT INTO patients (id, name, age, gender, conditions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [patientId, name || '', age || '', gender || '', JSON.stringify(conditions || []), now, now],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error creating patient', details: err.message });
                        }
                        res.json({ success: true, message: 'Patient created' });
                    }
                );
            }
        });
    });
});

// Upload report
app.post('/api/patients/:patientId/reports', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const { name, size, type, dataUrl, extractedConditions, summary } = req.body;

    const uploadedAt = new Date().toISOString();

    db.run(
        'INSERT INTO reports (patient_id, name, size, type, data_url, extracted_conditions, summary, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [patientId, name, size || 0, type || '', dataUrl || null, JSON.stringify(extractedConditions || []), summary || null, uploadedAt],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error saving report', details: err.message });
            }

            // Update patient conditions if new ones detected
            if (extractedConditions && extractedConditions.length > 0) {
                db.get('SELECT conditions FROM patients WHERE id = ?', [patientId], (err, patient) => {
                    if (!err && patient) {
                        const existingConditions = safeParseJSON(patient.conditions, []);
                        const updatedConditions = [...new Set([...existingConditions, ...extractedConditions])];
                        
                        db.run('UPDATE patients SET conditions = ?, updated_at = ? WHERE id = ?',
                            [JSON.stringify(updatedConditions), new Date().toISOString(), patientId],
                            () => {});
                    }
                });
            }

            res.json({ success: true, reportId: this.lastID, message: 'Report saved' });
        }
    );
});

// Save prescription
app.post('/api/patients/:patientId/prescriptions', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const prescriptionData = req.body;

    const date = prescriptionData.date || new Date().toISOString();

    db.run(
        `INSERT INTO prescriptions 
        (patient_id, patient_name, patient_age, patient_gender, medicines, dietary_advice, general_instructions, follow_up, doctor_id, content, warnings, doctor_notes, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            patientId,
            prescriptionData.patientName || '',
            prescriptionData.patientAge || '',
            prescriptionData.patientGender || '',
            JSON.stringify(prescriptionData.medicines || []),
            prescriptionData.dietaryAdvice || '',
            prescriptionData.generalInstructions || '',
            prescriptionData.followUp || '',
            prescriptionData.doctorId || '',
            prescriptionData.content || '',
            prescriptionData.warnings ? 1 : 0,
            prescriptionData.doctorNotes || '',
            date
        ],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error saving prescription', details: err.message });
            }
            res.json({ success: true, prescriptionId: this.lastID, message: 'Prescription saved' });
        }
    );
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Root route - serve the main index page
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index (2).html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send(`
            <html>
                <head><title>DigiRx API Server</title></head>
                <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
                    <h1>🚀 DigiRx API Server</h1>
                    <p>Server is running successfully!</p>
                    <p>Please access:</p>
                    <ul style="text-align: left; display: inline-block;">
                        <li><a href="/index (2).html">Login Page</a></li>
                        <li><a href="/doctor (2).html">Doctor Dashboard</a></li>
                        <li><a href="/patient (2).html">Patient Dashboard</a></li>
                    </ul>
                </body>
            </html>
        `);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Digital Prescription API Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: ${DB_PATH}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});

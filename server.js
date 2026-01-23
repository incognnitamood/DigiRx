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
        // Enforce foreign keys in SQLite
        db.run('PRAGMA foreign_keys = ON');
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
            blood_group TEXT,
            weight TEXT,
            height TEXT,
            conditions TEXT,
            created_at TEXT,
            updated_at TEXT
        )`);

        // Add new columns to existing patients table (for existing databases)
        db.run(`ALTER TABLE patients ADD COLUMN blood_group TEXT`, () => {});
        db.run(`ALTER TABLE patients ADD COLUMN weight TEXT`, () => {});
        db.run(`ALTER TABLE patients ADD COLUMN height TEXT`, () => {});

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

        // Medication tracking table
        db.run(`CREATE TABLE IF NOT EXISTS medication_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            prescription_id INTEGER NOT NULL,
            medicine_name TEXT NOT NULL,
            dosage TEXT,
            frequency TEXT,
            duration INTEGER,
            timing TEXT,
            schedule_type TEXT, -- 'daily', 'specific_days', 'as_needed'
            schedule_days TEXT, -- JSON array of days ['Monday', 'Wednesday', 'Friday']
            reminder_times TEXT, -- JSON array of times ['08:00', '14:00', '20:00']
            start_date TEXT,
            end_date TEXT,
            created_at TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
        )`);

        // Medication intake logs
        db.run(`CREATE TABLE IF NOT EXISTS medication_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            medication_tracking_id INTEGER NOT NULL,
            medicine_name TEXT NOT NULL,
            scheduled_time TEXT,
            taken_time TEXT,
            status TEXT, -- 'taken', 'missed', 'delayed'
            notes TEXT,
            created_at TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (medication_tracking_id) REFERENCES medication_tracking(id)
        )`);

        // Exercise/activity tracking
        db.run(`CREATE TABLE IF NOT EXISTS activity_tracking (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            prescription_id INTEGER NOT NULL,
            activity_name TEXT NOT NULL,
            frequency TEXT,
            duration INTEGER,
            instructions TEXT,
            reminder_times TEXT, -- JSON array of times
            start_date TEXT,
            end_date TEXT,
            created_at TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (prescription_id) REFERENCES prescriptions(id)
        )`);

        // Activity logs
        db.run(`CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL,
            activity_tracking_id INTEGER NOT NULL,
            activity_name TEXT NOT NULL,
            scheduled_date TEXT,
            completed_date TEXT,
            status TEXT, -- 'completed', 'missed', 'partial'
            notes TEXT,
            created_at TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id),
            FOREIGN KEY (activity_tracking_id) REFERENCES activity_tracking(id)
        )`);

        // Images table (doctor-uploaded medical images)
        db.run(`CREATE TABLE IF NOT EXISTS images (
            id TEXT PRIMARY KEY,
            patient_id TEXT NOT NULL,
            filename TEXT,
            filetype TEXT,
            data_url TEXT,
            uploaded_at TEXT,
            uploaded_by TEXT,
            FOREIGN KEY (patient_id) REFERENCES patients(id)
        )`);

        // Notification preferences table
        db.run(`CREATE TABLE IF NOT EXISTS notification_preferences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id TEXT NOT NULL UNIQUE,
            reminder_interval INTEGER DEFAULT 15,
            snooze_duration INTEGER DEFAULT 10,
            enable_notifications INTEGER DEFAULT 1,
            created_at TEXT,
            updated_at TEXT,
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

function ensurePatientExists(patientId, cb) {
    const now = new Date().toISOString();
    db.get('SELECT id FROM patients WHERE id = ?', [patientId], (err, row) => {
        if (err) return cb(err);
        if (row) return cb(null);

        db.run(
            'INSERT INTO patients (id, name, age, gender, blood_group, weight, height, conditions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [patientId, '', '', '', '', '', '', JSON.stringify([]), now, now],
            (err) => cb(err || null)
        );
    });
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
                    exists: false,
                    id: patientId,
                    name: '',
                    age: '',
                    gender: '',
                    blood_group: '',
                    weight: '',
                    height: '',
                    conditions: [],
                    reports: [],
                    prescriptions: [],
                    images: [],
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

                    // Get images
                    db.all('SELECT * FROM images WHERE patient_id = ? ORDER BY uploaded_at DESC', [patientId], (err, images) => {
                        if (err) {
                            return res.status(500).json({ error: 'Database error fetching images', details: err.message });
                        }

                        // Format response
                        const patientData = {
                            exists: true,
                            id: patient.id,
                            name: patient.name || '',
                            age: patient.age || '',
                            gender: patient.gender || '',
                            blood_group: patient.blood_group || '',
                            weight: patient.weight || '',
                            height: patient.height || '',
                            conditions: safeParseJSON(patient.conditions, []),
                            reports: reports.map(r => ({
                                id: r.id,
                                name: r.name,
                                size: r.size,
                                type: r.type,
                                uploadedAt: r.uploaded_at,
                                extractedConditions: safeParseJSON(r.extracted_conditions, []),
                                dataUrl: r.data_url,
                                summary: r.summary
                            })),
                            prescriptions: prescriptions.map(p => ({
                                id: p.id,
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
                            images: images.map(img => ({
                                id: img.id,
                                filename: img.filename,
                                filetype: img.filetype,
                                data: img.data_url,
                                uploadedAt: img.uploaded_at,
                                uploadedBy: img.uploaded_by
                            })),
                            createdAt: patient.created_at || new Date().toISOString()
                        };

                        res.json(patientData);
                    });
                });
            });
        });
    });
});

// Save/Update patient data
app.post('/api/patients/:patientId', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const { name, age, gender, blood_group, weight, height, conditions } = req.body;

    const now = new Date().toISOString();

    db.serialize(() => {
        // Load existing patient (if any)
        db.get('SELECT * FROM patients WHERE id = ?', [patientId], (err, existing) => {
            if (err) {
                return res.status(500).json({ error: 'Database error', details: err.message });
            }

            if (existing) {
                // Preserve values if fields are omitted
                const nextName = (name !== undefined) ? (name || '') : (existing.name || '');
                const nextAge = (age !== undefined) ? (age || '') : (existing.age || '');
                const nextGender = (gender !== undefined) ? (gender || '') : (existing.gender || '');
                const nextBloodGroup = (blood_group !== undefined) ? (blood_group || '') : (existing.blood_group || '');
                const nextWeight = (weight !== undefined) ? (weight || '') : (existing.weight || '');
                const nextHeight = (height !== undefined) ? (height || '') : (existing.height || '');
                const nextConditions = (conditions !== undefined) ? JSON.stringify(conditions || []) : (existing.conditions || JSON.stringify([]));

                db.run(
                    'UPDATE patients SET name = ?, age = ?, gender = ?, blood_group = ?, weight = ?, height = ?, conditions = ?, updated_at = ? WHERE id = ?',
                    [nextName, nextAge, nextGender, nextBloodGroup, nextWeight, nextHeight, nextConditions, now, patientId],
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
                    'INSERT INTO patients (id, name, age, gender, blood_group, weight, height, conditions, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                    [patientId, name || '', age || '', gender || '', blood_group || '', weight || '', height || '', JSON.stringify(conditions || []), now, now],
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

    ensurePatientExists(patientId, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error ensuring patient exists', details: err.message });
        }

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
});

// Save prescription
app.post('/api/patients/:patientId/prescriptions', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const prescriptionData = req.body;

    const date = prescriptionData.date || new Date().toISOString();

    ensurePatientExists(patientId, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error ensuring patient exists', details: err.message });
        }

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
});

// Delete a prescription (doctor)
app.delete('/api/patients/:patientId/prescriptions/:prescriptionId', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const prescriptionId = parseInt(req.params.prescriptionId, 10);

    if (!prescriptionId || Number.isNaN(prescriptionId)) {
        return res.status(400).json({ error: 'Invalid prescription id' });
    }

    db.serialize(() => {
        // Delete medication logs tied to this prescription
        db.run(
            `DELETE FROM medication_logs WHERE medication_tracking_id IN (
                SELECT id FROM medication_tracking WHERE prescription_id = ? AND patient_id = ?
            )`,
            [prescriptionId, patientId],
            (err) => {
                if (err) return res.status(500).json({ error: 'Failed to delete medication logs', details: err.message });

                // Delete medication tracking
                db.run(
                    'DELETE FROM medication_tracking WHERE prescription_id = ? AND patient_id = ?',
                    [prescriptionId, patientId],
                    (err) => {
                        if (err) return res.status(500).json({ error: 'Failed to delete medication tracking', details: err.message });

                        // Delete activity logs tied to this prescription
                        db.run(
                            `DELETE FROM activity_logs WHERE activity_tracking_id IN (
                                SELECT id FROM activity_tracking WHERE prescription_id = ? AND patient_id = ?
                            )`,
                            [prescriptionId, patientId],
                            (err) => {
                                if (err) return res.status(500).json({ error: 'Failed to delete activity logs', details: err.message });

                                // Delete activity tracking
                                db.run(
                                    'DELETE FROM activity_tracking WHERE prescription_id = ? AND patient_id = ?',
                                    [prescriptionId, patientId],
                                    (err) => {
                                        if (err) return res.status(500).json({ error: 'Failed to delete activities', details: err.message });

                                        // Finally delete the prescription
                                        db.run(
                                            'DELETE FROM prescriptions WHERE id = ? AND patient_id = ?',
                                            [prescriptionId, patientId],
                                            function(err) {
                                                if (err) return res.status(500).json({ error: 'Failed to delete prescription', details: err.message });
                                                res.json({ success: true, deleted: this.changes });
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
});

// Delete a patient report (patient)
app.delete('/api/patients/:patientId/reports/:reportId', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const reportId = parseInt(req.params.reportId, 10);
    if (!reportId || Number.isNaN(reportId)) {
        return res.status(400).json({ error: 'Invalid report id' });
    }

    db.run('DELETE FROM reports WHERE id = ? AND patient_id = ?', [reportId, patientId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete report', details: err.message });
        }
        res.json({ success: true, deleted: this.changes });
    });
});

// Upload image
app.post('/api/patients/:patientId/images', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const { id, filename, filetype, data, uploadedAt, uploadedBy } = req.body;

    const imageId = id || ('img_' + Date.now());
    const ts = uploadedAt || new Date().toISOString();

    ensurePatientExists(patientId, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error ensuring patient exists', details: err.message });
        }

        db.run(
            'INSERT OR REPLACE INTO images (id, patient_id, filename, filetype, data_url, uploaded_at, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [imageId, patientId, filename || '', filetype || '', data || null, ts, uploadedBy || 'Doctor'],
            function(err) {
                if (err) {
                    return res.status(500).json({ error: 'Database error saving image', details: err.message });
                }
                res.json({ success: true, imageId, message: 'Image saved' });
            }
        );
    });
});

// ============================================
// MEDICATION TRACKING ENDPOINTS
// ============================================

// Save medication tracking record
app.post('/api/medication-tracking', (req, res) => {
    const { patient_id, prescription_id, medicine_name, dosage, frequency, duration, timing, 
            schedule_type, schedule_days, reminder_times, start_date, end_date, created_at } = req.body;

    db.run(
        'INSERT INTO medication_tracking (patient_id, prescription_id, medicine_name, dosage, frequency, duration, timing, schedule_type, schedule_days, reminder_times, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [patient_id, prescription_id, medicine_name, dosage, frequency, duration, timing, 
         schedule_type, JSON.stringify(schedule_days), JSON.stringify(reminder_times), 
         start_date, end_date, created_at],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error saving medication tracking', details: err.message });
            }
            res.json({ success: true, trackingId: this.lastID });
        }
    );
});

// Save activity tracking record
app.post('/api/activity-tracking', (req, res) => {
    const { patient_id, prescription_id, activity_name, frequency, duration, instructions, 
            reminder_times, start_date, end_date, created_at } = req.body;

    db.run(
        'INSERT INTO activity_tracking (patient_id, prescription_id, activity_name, frequency, duration, instructions, reminder_times, start_date, end_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [patient_id, prescription_id, activity_name, frequency, duration, instructions, 
         JSON.stringify(reminder_times), start_date, end_date, created_at],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error saving activity tracking', details: err.message });
            }
            res.json({ success: true, trackingId: this.lastID });
        }
    );
});

// ============================================
// MEDICATION TRACKING ENDPOINTS
// ============================================

// Get patient's medication schedule
app.get('/api/patients/:patientId/medication-schedule', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    
    db.all(`
        SELECT mt.*, p.date as prescription_date, p.doctor_id
        FROM medication_tracking mt
        JOIN prescriptions p ON mt.prescription_id = p.id
        WHERE mt.patient_id = ? 
        AND (mt.end_date IS NULL OR mt.end_date >= date('now'))
        ORDER BY mt.schedule_type, mt.medicine_name
    `, [patientId], (err, medications) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        // Parse JSON fields
        const parsedMedications = medications.map(med => ({
            ...med,
            schedule_days: safeParseJSON(med.schedule_days, []),
            reminder_times: safeParseJSON(med.reminder_times, [])
        }));
        
        res.json(parsedMedications);
    });
});

// Log medication intake
app.post('/api/medication/:trackingId/log', (req, res) => {
    const trackingId = req.params.trackingId;
    const { scheduledTime, status, notes } = req.body;
    const takenTime = new Date().toISOString();
    // Store full datetime for scheduled_time (today's date + the scheduled time)
    const today = new Date().toISOString().split('T')[0];
    const fullScheduledTime = `${today}T${scheduledTime}:00`;
    
    db.run(
        'INSERT INTO medication_logs (patient_id, medication_tracking_id, medicine_name, scheduled_time, taken_time, status, notes, created_at) VALUES ((SELECT patient_id FROM medication_tracking WHERE id = ?), ?, (SELECT medicine_name FROM medication_tracking WHERE id = ?), ?, ?, ?, ?, ?)',
        [trackingId, trackingId, trackingId, fullScheduledTime, takenTime, status, notes || '', takenTime],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error logging medication', details: err.message });
            }
            res.json({ success: true, logId: this.lastID });
        }
    );
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API is running' });
});

// Get today's medication schedule with status (fetches all logs for today)
app.get('/api/patients/:patientId/today-medications', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const today = new Date().toISOString().split('T')[0];
    
    // First get all medications
    db.all(`
        SELECT mt.*
        FROM medication_tracking mt
        WHERE mt.patient_id = ? 
        AND (mt.end_date IS NULL OR mt.end_date >= date('now'))
        ORDER BY mt.medicine_name
    `, [patientId], (err, medications) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        // Get all logs for today
        db.all(`
            SELECT medication_tracking_id, scheduled_time, status, taken_time
            FROM medication_logs
            WHERE patient_id = ? AND date(scheduled_time) = date('now')
        `, [patientId], (err, logs) => {
            if (err) {
                return res.status(500).json({ error: 'Database error fetching logs', details: err.message });
            }
            
            // Create a map of taken times for quick lookup
            const takenTimes = {};
            logs.forEach(log => {
                const key = `${log.medication_tracking_id}-${log.scheduled_time.split('T')[1]?.substring(0,5) || log.scheduled_time}`;
                takenTimes[key] = log.status;
            });
            
            const parsedMedications = medications.map(med => ({
                ...med,
                schedule_days: safeParseJSON(med.schedule_days, []),
                reminder_times: safeParseJSON(med.reminder_times, []),
                taken_times: takenTimes // Include the map of which times are taken
            }));
            
            res.json(parsedMedications);
        });
    });
});

// Get activity/exercise schedule
app.get('/api/patients/:patientId/activity-schedule', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    
    db.all(`
        SELECT *
        FROM activity_tracking
        WHERE patient_id = ?
        AND (end_date IS NULL OR end_date >= date('now'))
        ORDER BY activity_name
    `, [patientId], (err, activities) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        const parsedActivities = activities.map(activity => ({
            ...activity,
            reminder_times: safeParseJSON(activity.reminder_times, [])
        }));
        
        res.json(parsedActivities);
    });
});

// Log activity completion
app.post('/api/activity/:trackingId/log', (req, res) => {
    const trackingId = req.params.trackingId;
    const { status, notes } = req.body;
    const completedTime = new Date().toISOString();
    const scheduledDate = new Date().toISOString().split('T')[0];
    
    db.run(
        'INSERT INTO activity_logs (patient_id, activity_tracking_id, activity_name, scheduled_date, completed_date, status, notes, created_at) VALUES ((SELECT patient_id FROM activity_tracking WHERE id = ?), ?, (SELECT activity_name FROM activity_tracking WHERE id = ?), ?, ?, ?, ?, ?)',
        [trackingId, trackingId, trackingId, scheduledDate, completedTime, status, notes || '', completedTime],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Database error logging activity', details: err.message });
            }
            res.json({ success: true, logId: this.lastID });
        }
    );
});

// Get notification preferences
app.get('/api/patients/:patientId/notification-preferences', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    
    db.get('SELECT * FROM notification_preferences WHERE patient_id = ?', [patientId], (err, prefs) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        // Return defaults if not set
        if (!prefs) {
            return res.json({
                reminder_interval: 15,
                snooze_duration: 10,
                enable_notifications: 1
            });
        }
        
        res.json({
            reminder_interval: prefs.reminder_interval,
            snooze_duration: prefs.snooze_duration,
            enable_notifications: prefs.enable_notifications
        });
    });
});

// Update notification preferences
app.post('/api/patients/:patientId/notification-preferences', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const { reminder_interval, snooze_duration, enable_notifications } = req.body;
    const now = new Date().toISOString();
    
    // Check if preferences exist
    db.get('SELECT id FROM notification_preferences WHERE patient_id = ?', [patientId], (err, existing) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        if (existing) {
            // Update existing preferences
            db.run(
                'UPDATE notification_preferences SET reminder_interval = ?, snooze_duration = ?, enable_notifications = ?, updated_at = ? WHERE patient_id = ?',
                [reminder_interval || 15, snooze_duration || 10, enable_notifications !== undefined ? enable_notifications : 1, now, patientId],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error updating preferences', details: err.message });
                    }
                    res.json({ success: true, message: 'Preferences updated' });
                }
            );
        } else {
            // Create new preferences
            db.run(
                'INSERT INTO notification_preferences (patient_id, reminder_interval, snooze_duration, enable_notifications, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
                [patientId, reminder_interval || 15, snooze_duration || 10, enable_notifications !== undefined ? enable_notifications : 1, now, now],
                (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Database error creating preferences', details: err.message });
                    }
                    res.json({ success: true, message: 'Preferences created' });
                }
            );
        }
    });
});

// Get today's activities with status
app.get('/api/patients/:patientId/today-activities', (req, res) => {
    const patientId = req.params.patientId.toUpperCase();
    const today = new Date().toISOString().split('T')[0];
    
    db.all(`
        SELECT 
            at.*,
            al.status as today_status,
            al.completed_date as today_completed_time
        FROM activity_tracking at
        LEFT JOIN activity_logs al ON at.id = al.activity_tracking_id 
            AND date(al.scheduled_date) = date('now')
        WHERE at.patient_id = ?
        AND (at.end_date IS NULL OR at.end_date >= date('now'))
        ORDER BY at.activity_name
    `, [patientId], (err, activities) => {
        if (err) {
            return res.status(500).json({ error: 'Database error', details: err.message });
        }
        
        const parsedActivities = activities.map(activity => ({
            ...activity,
            reminder_times: safeParseJSON(activity.reminder_times, [])
        }));
        
        res.json(parsedActivities);
    });
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

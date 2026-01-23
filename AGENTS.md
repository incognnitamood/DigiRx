# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

DigiRx is a digital prescription system designed for rural healthcare. It provides voice-assisted prescription creation, drug interaction checking, and medication tracking for patients and doctors.

## Development Commands

```powershell
# Start the server (runs on http://localhost:3000)
npm start
# or
npm run dev

# Check database schema and integrity (useful for debugging)
node .\check_db_schema.js

# Access the application
# Login page: http://localhost:3000 (redirects to index (2).html)
# Doctor dashboard: http://localhost:3000/doctor (2).html
# Patient dashboard: http://localhost:3000/patient (2).html
```

There are no configured lint, format, or test commands.

## Architecture

### Backend (`server.js`)

Express.js server with SQLite database (`patient_database.db`). Serves both the REST API and static frontend files.
- Port: 3000 (configurable via `PORT` env var)
- JSON payload limit: 50mb (for file uploads as data URLs)
- Foreign keys enabled: `PRAGMA foreign_keys = ON`
- Database auto-initializes tables on startup via `initializeDatabase()`

**CRITICAL API Pattern**: All patient-related endpoints use uppercase patient IDs (auto-converted via `toUpperCase()`). Always use uppercase patient IDs (e.g., `PID12345`) in API calls.

**Key API Routes**:
- `GET/POST /api/patients/:patientId` - Patient CRUD (auto-creates patient if missing)
- `POST /api/patients/:patientId/reports` - Upload medical reports (auto-updates patient conditions)
- `POST /api/patients/:patientId/prescriptions` - Save prescriptions (returns `prescriptionId`)
- `DELETE /api/patients/:patientId/prescriptions/:prescriptionId` - Delete prescription (cascades to tracking/logs)
- `DELETE /api/patients/:patientId/reports/:reportId` - Delete patient report
- `POST /api/patients/:patientId/images` - Upload medical images (stores as data URLs)
- `POST /api/medication-tracking`, `POST /api/activity-tracking` - Create tracking records
- `GET /api/patients/:patientId/medication-schedule` - Get active medications
- `GET /api/patients/:patientId/today-medications` - Get today's meds with taken status
- `POST /api/medication/:trackingId/log` - Log medication intake
- `GET /api/patients/:patientId/activity-schedule` - Get exercise schedule
- `GET /api/patients/:patientId/today-activities` - Get today's activities with status
- `POST /api/activity/:trackingId/log` - Log activity completion

### Frontend

Vanilla HTML/CSS/JS with no build step. Files are served directly by Express.

**Pages**:
- `index (2).html` - Login page (patient ID or doctor portal)
- `doctor (2).html` - Doctor dashboard (patient lookup, prescription creation, voice input)
- `patient (2).html` - Patient dashboard (view prescriptions, upload reports, medication tracking)

**Client Logic** (`app (1).js`):
- Contains `DRUG_DATABASE` - comprehensive rule-based drug contraindication database with 50+ medications
  - Each drug has `contraindications` array (conditions to check) and `warnings` object (specific warning messages)
  - Conditions checked: `hypertension`, `diabetes`, `asthma`, `pregnancy`, `renal_impairment`, `liver_disease`
  - Sources: WHO Essential Medicines List (EML) and FDA DailyMed
- Voice input via Web Speech API (browser-native, no API key needed)
- OCR via Tesseract.js (loaded from CDN in doctor page for report text extraction)
- Doctor data stored in localStorage (name, ID, signature); patient data stored in SQLite via API

### Database Schema

SQLite with these tables:
- `patients` - Basic demographics and extracted medical conditions (JSON array)
- `reports` - Uploaded medical reports with OCR-extracted conditions
- `prescriptions` - Prescription records with medicines (JSON array)
- `medication_tracking` / `medication_logs` - Medication schedule and intake logs
- `activity_tracking` / `activity_logs` - Exercise/activity tracking
- `images` - Doctor-uploaded medical images (stored as data URLs)

All tables use foreign keys referencing `patients(id)`.

### Medication Reminder System

When a doctor saves a prescription (in `app (1).js`):
1. Prescription saved to backend via `POST /api/patients/:patientId/prescriptions`
2. `createMedicationTracking()` auto-creates tracking records for each medicine in prescription
   - Calls `determineReminderTimes(frequency, timing)` to calculate reminder times
   - Calculates `start_date` (today) and `end_date` (start + duration days)
   - Sends to `POST /api/medication-tracking`
3. `createActivityTracking()` parses exercise instructions from `generalInstructions` field
   - Detects patterns like "morning walk", "yoga", "30 minutes"
   - Creates activity tracking records via `POST /api/activity-tracking`

Patient dashboard (`patient (2).html`):
- Loads today's medications via `GET /api/patients/:patientId/today-medications`
- Shows medications grouped by time period (Morning/Afternoon/Evening/Night)
- Browser notifications via `checkMedicationReminders()` running every minute (when due)
- Patients mark doses as taken via `markMedicationTaken()` → calls `POST /api/medication/:trackingId/log`
- Activity tracking similar: `markActivityCompleted()` → calls `POST /api/activity/:trackingId/log`

## Code Conventions

- **Windows development environment**: Use PowerShell commands and backslash paths (e.g., `node .\check_db_schema.js`)
- File names contain spaces and parentheses (e.g., `app (1).js`, `doctor (2).html`) - quote paths if needed in shell
- JSON fields in SQLite are stored as stringified JSON and parsed with `safeParseJSON()` helper
- Dates stored as ISO strings (`new Date().toISOString()`)
- Patient IDs are uppercase strings (e.g., `PID12345`) - API auto-converts to uppercase
- Database location: `patient_database.db` in project root (can override with `DB_PATH` env var)

## Important Implementation Notes

### When Adding New Drugs to DRUG_DATABASE
- Add entries in `app (1).js` following the existing pattern
- Include `contraindications` array and `warnings` object
- Reference WHO EML or FDA sources when possible
- Use lowercase for drug names and condition keys
- Supported condition keys: `hypertension`, `diabetes`, `asthma`, `pregnancy`, `renal_impairment`, `liver_disease`

### When Modifying Database Schema
- Add new tables or columns in `initializeDatabase()` in `server.js`
- Use `ALTER TABLE` with error suppression (`() => {}`) for existing databases
- Always include foreign keys referencing `patients(id)` for patient-related tables
- Run `node .\check_db_schema.js` to verify schema changes

### When Adding New API Endpoints
- Follow the pattern: convert `patientId` to uppercase with `req.params.patientId.toUpperCase()`
- Use `ensurePatientExists()` helper for patient-dependent operations
- Store arrays/objects as JSON with `JSON.stringify()`, parse with `safeParseJSON()`
- Return consistent response format: `{ success: true, ... }` or `{ error: '...', details: '...' }`

### Data Flow for Prescriptions
1. Doctor creates prescription in `doctor (2).html` (with voice input or manual entry)
2. Drug contraindication checking happens client-side using `DRUG_DATABASE`
3. Prescription saved via API to `prescriptions` table
4. Medication and activity tracking auto-created client-side (calls separate APIs)
5. Patient views in `patient (2).html` with reminder notifications

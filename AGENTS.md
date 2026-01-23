# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

DigiRx is a digital prescription system designed for rural healthcare. It provides voice-assisted prescription creation, drug interaction checking, and medication tracking for patients and doctors.

## Development Commands

```powershell
# Start the server (runs on http://localhost:3000)
npm start

# Check database schema and integrity
node check_db_schema.js
```

There are no configured lint, format, or test commands.

## Architecture

### Backend (`server.js`)

Express.js server with SQLite database (`patient_database.db`). Serves both the REST API and static frontend files.

**API Pattern**: All patient-related endpoints use uppercase patient IDs (auto-converted via `toUpperCase()`).

**Key API Routes**:
- `GET/POST /api/patients/:patientId` - Patient CRUD
- `POST /api/patients/:patientId/reports` - Upload medical reports
- `POST /api/patients/:patientId/prescriptions` - Save prescriptions
- `POST /api/patients/:patientId/images` - Upload medical images
- `/api/medication-tracking`, `/api/activity-tracking` - Tracking endpoints

### Frontend

Vanilla HTML/CSS/JS with no build step. Files are served directly by Express.

**Pages**:
- `index (2).html` - Login page (patient ID or doctor portal)
- `doctor (2).html` - Doctor dashboard (patient lookup, prescription creation, voice input)
- `patient (2).html` - Patient dashboard (view prescriptions, upload reports, medication tracking)

**Client Logic** (`app (1).js`):
- Contains `DRUG_DATABASE` - rule-based drug contraindication checking against patient conditions
- Voice input via Web Speech API
- OCR via Tesseract.js (loaded from CDN in doctor page)
- Doctor data stored in localStorage; patient data stored in SQLite via API

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

When a doctor saves a prescription:
1. `createMedicationTracking()` auto-creates tracking records for each medicine
2. `createActivityTracking()` parses exercise instructions into activity records
3. Reminder times are determined by `determineReminderTimes()` based on frequency/timing

Patient dashboard:
- Shows medications grouped by time period (Morning/Afternoon/Evening/Night)
- Browser notifications via `checkMedicationReminders()` running every minute
- Patients mark doses as taken via `markMedicationTaken()`

## Code Conventions

- File names contain spaces and parentheses (e.g., `app (1).js`, `doctor (2).html`)
- JSON fields in SQLite are stored as stringified JSON and parsed with `safeParseJSON()`
- Dates stored as ISO strings
- Patient IDs are uppercase strings (e.g., `PID12345`)

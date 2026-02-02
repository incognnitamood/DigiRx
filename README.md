# DigiRx
# DigiRx - Digital Prescription System

A comprehensive healthcare management platform that connects doctors and patients through digital prescriptions, medication tracking, and patient monitoring.

## 🏥 Features

### Doctor Portal
- **Patient Lookup**: Search and access patient medical records
- **Digital Prescriptions**: Create prescriptions with voice-assisted input
- **Drug Interaction Warnings**: Automatic contraindication detection
- **Medical History Access**: View patient uploaded reports and conditions
- **Image Management**: Upload and share medical images (X-rays, scans)
- **Read-only Patient Details**: Doctors can view but not modify patient demographics

### Patient Portal
- **Personal Health Records**: Manage personal information and medical history
- **Prescription Access**: View and track doctor-prescribed medications
- **Medication Tracking**: Daily medication logging with compliance monitoring
- **Activity Tracking**: Exercise and lifestyle activity logging
- **Medical Report Upload**: Upload medical documents for doctor review
- **Selective Field Editing**: Update age, weight, and height while core details remain locked

### Core Functionality
- **Medication Scheduling**: Automatic medication reminders based on prescription frequency
- **Progress Dashboard**: Visual statistics and compliance metrics
- **OCR Integration**: Extract medical conditions from uploaded documents
- **Real-time Notifications**: Browser-based alerts for medication reminders

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Node.js with Express.js
- **Database**: SQLite3
- **OCR Engine**: Tesseract.js
- **Voice Recognition**: Web Speech API
- **Styling**: Custom CSS with modern UI components

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd DTL
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to:
```
http://localhost:3000
```

### Usage

#### For Patients:
1. Access the patient portal
2. Enter your Patient ID or create a new account
3. Complete your personal information
4. Upload medical reports for doctor review
5. View prescriptions from your doctors
6. Track daily medications and activities
7. Monitor your health progress 

#### For Doctors:
1. Access the doctor portal
2. Enter patient ID to lookup medical records
3. Review patient history and uploaded reports
4. Create digital prescriptions with medication details
5. Add dietary advice and follow-up instructions
6. Upload medical images for patient reference
7. Monitor patient prescription history

## 📁 Project Structure

```
DTL/
├── server.js              # Main server file with API endpoints
├── app (1).js            # Client-side JavaScript for both portals
├── index (2).html        # Main login page
├── doctor (2).html       # Doctor dashboard
├── patient (2).html      # Patient dashboard
├── styles (1).css        # Global styling
├── package.json          # Project dependencies
├── patient_database.db   # SQLite database (auto-generated)
└── README.md            # This file
```

## 🔐 Security & Privacy

- All patient data is stored locally in SQLite database
- No external data transmission
- Role-based access control (doctor/patient)
- Patient demographic fields are protected from unauthorized modification
- Secure session management using localStorage

## 🎮 Gamification Features

- **Achievement Badges**: Earn badges for medication compliance milestones
- **Progress Tracking**: Daily, weekly, and monthly compliance statistics
- **Streak System**: Track consecutive days of perfect medication adherence
- **Visual Feedback**: Animated notifications for accomplishments

## 📱 Responsive Design

The application features a responsive design that works on:
- Desktop computers
- Tablets
- Mobile devices

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support, please contact the development team or create an issue in the repository.

## 🔄 Recent Updates

- **Field Mutability Policy**: Implemented role-based field editing restrictions
- **Gamification System**: Added achievement badges and progress tracking
- **Enhanced Validation**: Improved input validation for patient data
- **UI Improvements**: Better visual feedback and user experience enhancements

---
*Built for better rural healthcare access and management*

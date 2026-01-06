# BeyGo 🏛️

A Pokemon Go-style mobile application for exploring Tunisian Beylical history through augmented reality and interactive museum experiences.

![React Native](https://img.shields.io/badge/React_Native-Expo-blue)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)

## 📖 Overview

BeyGo transforms museum visits into engaging adventures. Users explore Tunisian museums, discover AR hotspots, collect puzzle pieces, and learn about the 27 Beys who ruled Tunisia from 1593 to 1957.

### Key Features

- 🗺️ **Geolocation-based Museum Discovery** - Find nearby museums with real-time location tracking
- 📸 **AR Puzzle Collection** - Scan AR markers to collect 9 puzzle pieces per Bey
- 🏆 **Gamification System** - Earn points, unlock achievements, climb leaderboards
- 📚 **Historical Education** - Learn about Muradid and Husaynid dynasties
- 🎁 **Rewards System** - Redeem points for discounts and merchandise
- 👥 **Social Features** - Compete on leaderboards, share achievements

## 🏗️ Architecture

```
BeyGo/
├── backend/                 # Node.js + Express API
│   ├── middleware/         # Auth, validation, file upload
│   ├── models/            # Mongoose schemas
│   ├── routes/            # REST API endpoints
│   └── seeds/             # Database seeding
│
├── mobile/                 # React Native + Expo App
│   └── src/
│       ├── navigation/    # React Navigation setup
│       ├── screens/       # UI screens
│       ├── services/      # API & location services
│       ├── store/         # Zustand state management
│       └── theme/         # Design system
│
├── dataset.csv            # Original Bey data (27 Beys)
├── dataset.json           # Structured Bey data
└── benchmark report.txt   # Performance benchmarks
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- Expo CLI
- iOS Simulator / Android Emulator / Physical device

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# Seed the database
npm run seed

# Start development server
npm run dev
```

### Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app, or press:
# - i for iOS Simulator
# - a for Android Emulator
```

## 📱 App Screens

### Authentication
- **Welcome Screen** - App introduction with features overview
- **Login Screen** - Email/password authentication
- **Register Screen** - Account creation with visitor/student selection

### Main Experience
- **Home Screen** - Dashboard with stats, active visits, quick actions
- **Explore Screen** - Browse and search museums
- **Map Screen** - Interactive map with museum markers and geofences
- **Profile Screen** - User stats, achievements, settings

### Museum & Bey Screens
- **Museum Detail** - Museum info, available Beys, AR hotspots
- **Bey List** - All 27 Beys with dynasty filters
- **Bey Detail** - Biography, reign info, puzzle status
- **Timeline** - Chronological view of Beylical history

### Puzzle & AR
- **Puzzle Screen** - 3x3 puzzle grid with collection progress
- **AR Camera** - Scan markers to collect pieces

### Social & Rewards
- **Leaderboard** - Rankings by points
- **Rewards** - Available and redeemed rewards

## 🗄️ Data Models

### Core Entities
- **User** - Authentication, points, achievements, collection progress
- **Museum** - Location, geofence, AR hotspots, available Beys
- **Bey** - Historical data, puzzle configuration, dynasty relation
- **Dynasty** - Muradid (1613-1702) and Husaynid (1705-1957)

### Activity Tracking
- **Visit** - Museum visit sessions with location logs
- **PuzzleChallenge** - Active puzzles with piece collection status
- **Reward/UserReward** - Reward catalog and redemptions

## 🎮 Game Mechanics

### Points System
| Action | Points |
|--------|--------|
| Collect puzzle piece | 10 |
| Complete puzzle | 100 |
| Complete museum visit | 50 |
| First visit of the day | 25 |

### Puzzle Collection
1. Visit a museum to start a puzzle challenge
2. Find 9 AR hotspots throughout the museum
3. Scan each marker to collect a puzzle piece
4. Complete all 9 pieces to unlock the Bey
5. Use hints (3 available) if you're stuck

## 🔌 API Endpoints

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/verify-student
```

### Museums
```
GET  /api/museums
GET  /api/museums/nearby?lat=&lng=
GET  /api/museums/:id
POST /api/museums/:id/detect
```

### Beys
```
GET  /api/beys
GET  /api/beys/timeline
GET  /api/beys/:id
GET  /api/beys/search?q=
```

### Visits & Challenges
```
POST /api/visits/start
POST /api/visits/:id/end
POST /api/challenges/start
POST /api/challenges/:id/collect-piece
POST /api/challenges/:id/use-hint
```

### Rewards
```
GET  /api/rewards
POST /api/rewards/:id/redeem
GET  /api/users/rewards
```

## 📊 Historical Data

The app includes data for all 27 Beys of Tunisia:

**Muradid Dynasty (1593-1702)**
- Murad I Bey through Murad III Bey
- 7 rulers over 109 years

**Husaynid Dynasty (1705-1957)**
- Hussein I Bey through Muhammad VIII al-Amin (Lamine)
- 20 rulers over 252 years

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + bcryptjs
- **File Uploads**: Multer
- **Validation**: express-validator

### Mobile
- **Framework**: React Native with Expo SDK 51
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **Maps**: react-native-maps
- **Camera/AR**: expo-camera, expo-gl
- **Location**: expo-location

## 🎨 Design System

### Colors
- Primary: `#1E3A5F` (Deep Blue)
- Secondary: `#8B4513` (Saddle Brown)
- Accent: `#D4AF37` (Gold)
- Success: `#28A745`
- Error: `#DC3545`

### Typography
- Display: 32px Bold
- Title: 24px Bold
- Body: 16px Regular
- Caption: 12px Regular

## 📝 License

This project is created for educational purposes as part of a museum exploration experience focused on Tunisian Beylical history.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📧 Support

For issues or questions, please open a GitHub issue or contact the development team.

---

**BeyGo** - Discover Tunisia's Royal Heritage 🏛️👑

# Growth Cream 🌱✨

Author: Aldane Hutchinson

A local-first productivity and utility Progressive Web App (PWA) that combines personal growth tracking, habit management, project/DevLog tracking, goals, image utilities, and storage growth tracking in one cohesive application.

![Growth Cream](https://img.shields.io/badge/PWA-Ready-pink)
![Offline-First](https://img.shields.io/badge/Offline-First-green)
![No-Backend](https://img.shields.io/badge/No-Backend-Required-blue)
![Vanilla-JS](https://img.shields.io/badge/Vanilla-JS-yellow)

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [File Structure](#file-structure)
- [IndexedDB Schema](#indexeddb-schema)
- [How Image Processing Works](#how-image-processing-works)
- [How Storage Tracking Works](#how-storage-tracking-works)
- [Browser Limitations](#browser-limitations)
- [PWA Installation](#pwa-installation)
- [Offline Functionality](#offline-functionality)
- [Development Setup](#development-setup)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)
- [Privacy](#privacy)
- [Data Export/Import](#data-exportimport)
- [Testing](#testing)
- [License](#license)

## Overview

Growth Cream is designed to give users useful tools in one application instead of forcing them to visit many different websites. It combines personal growth tracking with practical utilities, all while maintaining a cohesive, energetic design language.

The application is built with:
- **HTML5** - Semantic markup
- **CSS3** - Custom properties, animations, responsive design
- **Vanilla JavaScript** - ES modules, async/await
- **IndexedDB** - Local data persistence
- **Service Workers** - Offline functionality
- **Web App Manifest** - PWA installation

## Features

### 🌱 Habit Tracking
- Create, edit, and delete habits
- Mark habits complete with one click
- Undo completion
- Track current and longest streaks
- Calculate completion percentages
- View weekly and monthly progress
- Navigate through dates
- Real-time streak calculations

### 💻 Project/DevLog Tracking
- Create and manage development projects
- Add tasks with priorities
- Complete and delete tasks
- Add, edit, and delete notes
- Track project progress automatically
- Set project status (planning, active, paused, completed)
- Add GitHub URLs and technology stacks

### 🎯 Goals System
- Create goals with deadlines
- Track progress visually
- Mark goals as complete
- View active and completed goals
- Calculate days remaining
- Handle expired deadlines
- Progress updates with celebrations

### 🖼 Image Studio
- **Resize**: Maintain aspect ratio, custom dimensions
- **Compress**: Quality control, size comparison, percentage saved
- **Convert**: JPEG, PNG, WebP (AVIF if supported)
- **Crop**: Multiple aspect ratios (Free, 1:1, 4:3, 16:9, 3:2, 9:16)
- **Rotate**: 90°, 180°, 270°
- **Flip**: Horizontal and vertical
- **Batch Processing**: Process multiple images at once
- **Metadata**: Strip metadata by re-encoding
- All processing happens **locally in the browser**

### 💾 Storage Growth Tracker
- Track storage targets
- Record snapshots over time
- Calculate growth velocity (MB/day, GB/week, GB/month)
- Estimate fill dates based on historical data
- Browser storage analysis
- File System Access API support where available
- Honest reporting of limitations

### 📊 Dashboard
- Overall growth score
- Personal growth metrics
- Project progress tracking
- Goal achievement visualization
- Streak display
- Quick access to all features
- Real-time data aggregation

### ⚙ Settings
- Theme selection (Light/Dark/System)
- Data export (JSON format)
- Data import with validation
- Clear all data
- PWA status information
- Storage usage details

## Architecture

### Technology Stack

```
                 Growth Cream PWA
                        │
          ┌─────────────┴─────────────┐
          │                           │
       UI Layer                  Application Logic
          │                           │
 HTML + CSS                    Feature modules
          │                           │
          └─────────────┬─────────────┘
                        │
                  Data / Services
                        │
             ┌──────────┴──────────┐
             │                     │
          IndexedDB            Browser APIs
             │                     │
       Application data       Files / Images
                             Notifications
                             Storage APIs
                             Service Worker
```

### Key Design Decisions

1. **Single Page Application (SPA)** - Uses hash-based routing for smooth navigation without page reloads
2. **Modular Architecture** - Separation of concerns between UI, business logic, and data layer
3. **Offline-First** - IndexedDB as source of truth, service worker for caching
4. **No Dependencies** - Pure vanilla JavaScript, no frameworks or libraries
5. **Local Processing** - All data stays on the user's device

## File Structure

```
growth-cream/
│
├── index.html              # Single page app entry point
├── offline.html            # Offline fallback page
├── 404.html                # Custom 404 error page
├── manifest.webmanifest    # PWA manifest
├── sw.js                   # Service worker
├── favicon.ico             # Site favicon
│
├── assets/
│   ├── icons/              # PWA icons (various sizes)
│   │   ├── icon-72.png
│   │   ├── icon-96.png
│   │   ├── icon-128.png
│   │   ├── icon-144.png
│   │   ├── icon-192.png
│   │   ├── icon-384.png
│   │   └── icon-512.png
│   │
│   └── images/             # Static images
│
├── css/
│   ├── variables.css       # Design tokens (colors, spacing, typography)
│   ├── main.css           # Base styles, reset, animations
│   ├── layout.css         # Grid systems, page layouts
│   ├── components.css     # Reusable UI components
│   ├── responsive.css     # Media queries for responsiveness
│   └── themes.css         # Light/dark theme transitions
│
├── js/
│   ├── app.js             # Application initialization
│   ├── router.js          # Hash-based routing system
│   │
│   ├── db/                # Database layer
│   │   ├── database.js    # Core IndexedDB management
│   │   ├── habits-db.js   # Habits CRUD operations
│   │   ├── projects-db.js # Projects, tasks, notes CRUD
│   │   ├── goals-db.js    # Goals CRUD operations
│   │   ├── images-db.js   # Image metadata CRUD
│   │   └── storage-db.js  # Storage tracking CRUD
│   │
│   ├── features/          # Feature modules
│   │   ├── dashboard.js   # Dashboard rendering
│   │   ├── habits.js      # Habit tracking UI
│   │   ├── projects.js    # Project management UI
│   │   ├── goals.js       # Goals tracking UI
│   │   ├── image-studio.js # Image processing UI
│   │   ├── storage-tracker.js # Storage tracking UI
│   │   └── settings.js    # Settings page
│   │
│   ├── services/          # Business logic
│   │   ├── image-resizer.js # Image resizing logic
│   │   ├── image-compressor.js # Image compression
│   │   ├── image-converter.js # Format conversion
│   │   ├── image-cropper.js # Crop, rotate, flip
│   │   ├── image-metadata.js # Metadata operations
│   │   ├── storage-calculator.js # Storage calculations
│   │   ├── growth-calculator.js # Growth metrics
│   │   └── streak-calculator.js # Streak calculations
│   │
│   ├── components/        # Reusable UI components
│   │   ├── navbar.js      # Navigation bar
│   │   ├── modal.js       # Modal dialogs
│   │   ├── toast.js       # Toast notifications
│   │   └── sparks.js      # Spark animations
│   │
│   └── utils/             # Utility functions
│       ├── dates.js       # Date manipulation
│       ├── format.js      # Formatting helpers
│       ├── validation.js  # Input validation
│       ├── files.js       # File handling
│       └── download.js    # Download helpers
│
└── README.md              # Documentation
```

### Key Files Explained

- **`app.js`** - Initializes the app, sets up router, registers service worker
- **`router.js`** - Handles hash-based navigation between features
- **`database.js`** - Manages IndexedDB connection and generic CRUD operations
- **`habits.js`** - Renders habit UI and handles user interactions
- **`image-studio.js`** - Manages image processing workflow
- **`storage-tracker.js`** - Handles storage device tracking and analysis
- **`navbar.js`** - Renders and manages navigation

## IndexedDB Schema

```javascript
GrowthCreamDB (version 1)
├── habits              # Habit definitions
│   ├── id              # Unique identifier
│   ├── name            # Habit name
│   ├── description     # Optional description
│   ├── frequency       # daily, weekly, custom
│   ├── target          # Daily target count
│   ├── color           # Display color
│   ├── icon            # Emoji icon
│   ├── createdAt       # Creation timestamp
│   └── updatedAt       # Last update timestamp
│
├── habitCompletions    # Habit completion records
│   ├── id              # Unique identifier
│   ├── habitId         # Reference to habit
│   ├── date            # Completion date (YYYY-MM-DD)
│   └── completedAt     # Completion timestamp
│
├── projects            # Project definitions
│   ├── id              # Unique identifier
│   ├── name            # Project name
│   ├── description     # Project description
│   ├── status          # planning, active, paused, completed, archived
│   ├── progress        # Progress percentage (0-100)
│   ├── githubUrl       # GitHub repository URL
│   ├── technologies    # Array of technology names
│   ├── milestones      # Array of milestones
│   ├── createdAt       # Creation timestamp
│   └── updatedAt       # Last update timestamp
│
├── tasks               # Project tasks
│   ├── id              # Unique identifier
│   ├── projectId       # Reference to project
│   ├── title           # Task title
│   ├── description     # Task description
│   ├── completed       # Completion status
│   ├── priority        # low, medium, high
│   ├── createdAt       # Creation timestamp
│   └── completedAt     # Completion timestamp
│
├── goals               # Personal goals
│   ├── id              # Unique identifier
│   ├── title           # Goal title
│   ├── description     # Goal description
│   ├── targetDate      # Target completion date
│   ├── progress        # Progress percentage (0-100)
│   ├── completed       # Completion status
│   ├── createdAt       # Creation timestamp
│   └── completedAt     # Completion timestamp
│
├── notes               # Project notes
│   ├── id              # Unique identifier
│   ├── projectId       # Reference to project
│   ├── title           # Note title
│   ├── content         # Note content
│   ├── createdAt       # Creation timestamp
│   └── updatedAt       # Last update timestamp
│
├── images              # Image metadata
│   ├── id              # Unique identifier
│   ├── fileName        # Original file name
│   ├── originalSize    # Original file size
│   ├── resultSize      # Processed file size
│   ├── operation       # Performed operation
│   ├── mimeType        # Image MIME type
│   ├── width           # Image width
│   ├── height          # Image height
│   └── createdAt       # Processing timestamp
│
├── imageJobs           # Batch processing jobs
│   ├── id              # Unique identifier
│   ├── fileName        # File being processed
│   ├── operation       # Operation type
│   ├── status          # pending, processing, completed, failed
│   ├── progress        # Progress percentage
│   ├── originalSize    # Original file size
│   ├── resultSize      # Result file size
│   ├── error           # Error message if failed
│   ├── createdAt       # Job creation timestamp
│   └── completedAt     # Job completion timestamp
│
├── storageDevices      # Storage tracking targets
│   ├── id              # Unique identifier
│   ├── name            # Device/Storage name
│   ├── type            # folder, drive, browser
│   ├── totalBytes      # Total storage capacity
│   ├── usedBytes       # Used storage
│   ├── freeBytes       # Free storage
│   └── createdAt       # Creation timestamp
│
├── storageSnapshots    # Storage measurements over time
│   ├── id              # Unique identifier
│   ├── deviceId        # Reference to storage device
│   ├── timestamp       # Measurement timestamp
│   ├── totalBytes      # Total capacity at time
│   ├── usedBytes       # Used storage at time
│   └── freeBytes       # Free storage at time
│
└── settings            # Application settings
    ├── key             # Setting name
    └── value           # Setting value
```

## How Image Processing Works

All image operations are performed locally using the HTML5 Canvas API:

1. **Image Loading**: Images are loaded using `FileReader` API
2. **Canvas Rendering**: Images are drawn onto HTML5 canvas elements
3. **Processing**: Various canvas operations are applied
4. **Export**: Canvas is converted to blob for download

### Resize
```javascript
// Canvas scaling with high-quality interpolation
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
```

### Compress
```javascript
// Canvas re-encoding with quality control
canvas.toBlob(callback, mimeType, quality);
```

### Convert
```javascript
// Canvas format conversion
canvas.toBlob(callback, targetFormat);
```

### Crop
```javascript
// Canvas region extraction
ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
```

### Security & Privacy
- No images are uploaded to any server
- All processing happens in-memory
- Object URLs are revoked after use
- File size limits (50MB max)
- Format validation

## How Storage Tracking Works

The storage tracker honestly reports what it can and cannot do:

### Browser Storage
- Uses `navigator.storage.estimate()` API
- Reports quota and usage
- Approximate values as reported by browser

### File System Access
- Uses File System Access API where available
- User must explicitly grant access to directories
- Analyzes files within granted access

### Manual Entry
- Users can manually enter storage values
- Snapshots are saved over time
- Growth calculations from historical data

### Calculations
```javascript
// Storage velocity
bytesPerDay = (lastUsed - firstUsed) / daysTracked
bytesPerWeek = bytesPerDay * 7
bytesPerMonth = bytesPerDay * 30

// Estimated fill date
daysUntilFull = freeBytes / bytesPerDay
fillDate = today + daysUntilFull
```

### Honest Limitations
- Cannot scan entire device without permission
- File System Access API not universally supported
- Browser storage estimates are approximate
- Growth calculations require historical data
- No invented fill dates without sufficient data

## Browser Limitations

### Fully Supported
- **IndexedDB** - All modern browsers
- **Service Workers** - All modern browsers (requires HTTPS)
- **Canvas API** - All modern browsers
- **Web App Manifest** - Chrome, Edge, Android

### Partially Supported
- **File System Access API** - Chrome, Edge only
- **AVIF format** - Chrome, Firefox (recent versions)
- **WebP format** - Not in older Safari

### Fallbacks
- Storage tracking falls back to browser storage estimation
- AVIF detection with dynamic support
- Format conversion limited to supported formats

## PWA Installation

### Desktop (Chrome/Edge)
1. Open the app in browser
2. Click install icon in address bar
3. Or go to Settings > Install Growth Cream

### Mobile (Android)
1. Open the app in Chrome
2. Tap menu (⋮)
3. Select "Add to Home Screen"

### iOS (Safari)
1. Open the app in Safari
2. Tap Share button
3. Select "Add to Home Screen"

## Offline Functionality

The app works fully offline after initial load:

- **Cached Shell**: All HTML, CSS, JS cached by service worker
- **Local Data**: All user data stored in IndexedDB
- **Image Processing**: Works offline (canvas-based)
- **No Server Required**: Everything runs locally

### What Works Offline
- ✅ Creating/editing habits
- ✅ Completing habits
- ✅ Project management
- ✅ Goal tracking
- ✅ Image processing
- ✅ Storage tracking
- ✅ Settings
- ✅ Data export

### What Doesn't Work Offline
- ❌ Loading external resources
- ❌ Checking for updates
- ❌ Accessing GitHub URLs (requires internet)

## Development Setup

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for service worker)

### Running Locally
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000

# Using VS Code
# Install "Live Server" extension and click "Go Live"
```

### Development Notes
- Service worker requires HTTPS or localhost
- No build process needed
- All files are served as-is
- ES modules require proper MIME types

## Production Deployment

### Static Hosting Options

#### GitHub Pages
```bash
# Push to repository
git add .
git commit -m "Deploy Growth Cream"
git push origin main
# Enable in Settings > Pages
```

#### Netlify
```bash
# Deploy via CLI
netlify deploy --prod
```

#### Vercel
```bash
# Deploy via CLI
vercel --prod
```

### Requirements
- HTTPS (required for service worker)
- Static file serving
- Proper MIME types for ES modules
- No server-side processing needed

## Troubleshooting

### App doesn't work offline
- Ensure service worker is registered
- Check browser console for errors
- Clear cache and reload
- Verify HTTPS or localhost

### Images won't process
- Check file size (max 50MB)
- Verify format is supported
- Try different browser
- Check console for errors

### Data not saving
- Check IndexedDB availability
- Ensure not in private/incognito mode
- Check storage quota
- Try clearing site data

### Service worker not updating
- Clear old caches
- Force reload (Ctrl+Shift+R)
- Check for registration errors
- Wait for new version activation

## Privacy

**All data stays on your device.**

- ✅ No data sent to servers
- ✅ Images processed locally
- ✅ Habits stored in IndexedDB
- ✅ No analytics or tracking
- ✅ No third-party services
- ✅ Complete data export
- ✅ One-click data deletion

## Data Export/Import

### Export
- All data exported as JSON
- Includes habits, projects, goals, settings
- Downloadable file
- Version metadata included

### Import
- Validates JSON structure
- Checks schema compatibility
- Handles duplicate IDs safely
- Provides user feedback
- Merges with existing data

### Export Format
```json
{
  "version": 1,
  "exportedAt": "2024-01-01T00:00:00Z",
  "habits": [...],
  "habitCompletions": [...],
  "projects": [...],
  "tasks": [...],
  "goals": [...],
  "storageDevices": [...],
  "storageSnapshots": [...],
  "settings": {...}
}
```

## Testing

### Database Tests
- ✅ CRUD operations
- ✅ Schema upgrades
- ✅ Indexed queries
- ✅ Error handling
- ✅ Empty database
- ✅ Corrupted data

### Feature Tests
- ✅ Habit creation/completion
- ✅ Streak calculations
- ✅ Project management
- ✅ Goal tracking
- ✅ Image processing
- ✅ Storage tracking

### PWA Tests
- ✅ Installation
- ✅ Offline functionality
- ✅ Service worker updates
- ✅ Cache management

### Data Tests
- ✅ Export/Import
- ✅ Schema validation
- ✅ Duplicate handling
- ✅ Error recovery

## License

This project is open source and available for personal and commercial use.

---

## Design Philosophy

Growth Cream uses a dark theme with neon pink accents to create an energetic, growth-oriented atmosphere. The spark animations represent growth and achievement.

### Visual Elements
- **Dark background** for readability
- **Neon pink** for actions and highlights
- **Spark animations** for achievements
- **Progress bars** for growth visualization
- **Cards** with subtle borders and shadows
- **Responsive design** for all devices

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Visible focus indicators
- Reduced motion support
- Good contrast ratios

---

**Growth Cream** - *Where every action creates growth* ✦
# 📷 Camera ZeroDay

> A tactical camera Progressive Web App with privacy mode

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/Built%20with-React%2018-61dafb)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org)
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5a0fc4)](https://web.dev/progressive-web-apps)

## 🎯 Overview

Camera ZeroDay is a cutting-edge Progressive Web App designed for precision photography with comprehensive metadata capture. It combines military-grade HUD overlays, GPS geolocation, device orientation tracking, and offline-first functionality into a single-page application that operates entirely within your browser.

### Key Highlights
- **Zero Server Required** — All data stored locally in IndexedDB
- **Privacy Mode** — Hides camera behind a 2048 game with pattern-based unlock
- **Full Offline Support** — Works completely offline, installable as native app
- **Military-Grade HUD** — Tactical overlays with multiple reticle types
- **Precise Metadata** — GPS coordinates, compass heading, device orientation, timestamps
- **Bilingual** — Full English and Russian localization
- **Secure** — Pattern-based security with debouncing protection

---

## ✨ Features

### 📸 Photography Capabilities
- **Multiple Camera Modes** — Switch between front and rear cameras
- **Tactical Overlays** — 6 different reticle types:
  - None (clean view)
  - Crosshair (simple center target)
  - Grid (composition guide)
  - Rangefinder (distance estimation)
  - Tactical (military-style HUD)
  - Mil-Dot (precision ranging)
- **Customizable Reticles** — Adjust opacity (0-100%) and color
- **Metadata Overlay** — Display all captured information on screen

### 🛰️ Precise Positioning
- **GPS Integration** — Real-time latitude, longitude, altitude, and accuracy
- **Compass Heading** — Magnetic orientation (alpha angle)
- **Device Tilt** — Pitch and roll tracking (beta & gamma angles)
- **Timestamp Recording** — Precise capture time for each photo

### 🎮 Privacy Mode
- **2048 Game** — Fully functional puzzle game as cover
- **Pattern-Based Unlock** — Draw 5-tap pattern on 3×3 grid
- **Quick Activation** — Tap pattern within 0.8 seconds
- **Seamless Integration** — Smooth transition between game and camera
- **Security Settings** — Configure unlock pattern in app settings

### 📱 PWA Features
- **Installable** — Add to home screen on Android and iOS
- **Offline-First** — Full functionality without internet
- **Auto-Update** — Background service worker keeps app current
- **Native Feel** — Immersive fullscreen experience
- **Auto-Install Banner** — Smart detection for installation prompts

### 🗂️ Gallery & Management
- **Photo Gallery** — Browse all captured images with thumbnails
- **Detailed View** — Full metadata display for each photo
- **Local Storage** — Base64 image storage with privacy protection
- **Batch Operations** — Export and manage photos locally

### ⚙️ Customization Settings
- **Reticle Configuration** — Type, color, opacity adjustment
- **GPS Settings** — Enable/disable location tracking
- **Camera Preferences** — Default camera selection
- **Audio Feedback** — Optional sound effects
- **Display Options** — Metadata visibility toggle
- **Watermark Settings** — Custom text overlay configuration
- **Privacy Configuration** — Pattern setup and behavior customization

---

## 🚀 Getting Started

### System Requirements
- **Browser Support** — Chrome/Edge 90+, Firefox 88+, Safari 15+
- **APIs Required** — Camera, Geolocation, Device Orientation
- **Storage** — Minimum 50MB available in browser storage

### Installation

#### Option 1: Web App (Recommended)
1. Open [Camera ZeroDay](https://camerazeroday.replit.dev) in your browser
2. Tap the install banner at the bottom of the 2048 game
3. Or use your browser's "Install app" option
4. Grant permission for camera, location, and device orientation

#### Option 2: Local Development
```bash
# Clone the repository
git clone <repository-url>
cd camerazeroday

# Install dependencies
npm install

# Start development server (with hot reload)
npm run dev
```

#### Option 3: Production Build (Local Testing)
To test the production build locally before deploying to Render:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Start production server
npm start
```

**Note:** The build step must be run before `npm start` because it creates the `dist/` folder with compiled assets. On Render, this happens automatically during deployment.

The production server runs at `http://localhost:5000` with compiled frontend and backend.

### First Launch
1. **Permissions** — Grant access to camera, GPS, and device motion
2. **Settings** — Configure reticle type and metadata display
3. **Privacy Setup** — Set your pattern unlock code (optional)
4. **Installation** — Install as PWA when prompted

---

## 🌐 Deployment to Render

Camera ZeroDay can be deployed to [Render.com](https://render.com) as a static site with Node.js backend. This is perfect for sharing the app publicly.

### Prerequisites
- GitHub account with the repository pushed
- Render.com account (free tier available)
- Node.js 18+ (Render default)

### Step-by-Step Deployment

#### 1. Prepare Your Repository
```bash
# Make sure everything is committed and pushed to GitHub
git add .
git commit -m "Ready for deployment to Render"
git push origin main
```

#### 2. Create a Render Service via GitHub
1. Visit [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → Select **"Web Service"**
3. **Connect GitHub:**
   - When prompted, click **"GitHub"** 
   - Authorize Render to access your GitHub repositories
   - You'll be redirected back to Render showing your repos
   - Select the **Camera ZeroDay** repository
   - Click **"Connect"**

#### 3. Automatic Configuration (Recommended)
The project includes a **`render.yaml`** file that automatically configures everything:

- ✅ Build Command: `npm ci --include=dev && npm run build`
- ✅ Start Command: `npm start`
- ✅ Environment: Node.js
- ✅ Plan: Free tier
- ✅ Environment Variables: `VITE_PRIVACY_MODE=true`

**Render automatically detects and uses this file.** Just continue to the next step!

#### 4. Manual Configuration (If render.yaml doesn't work)
If Render doesn't automatically detect the config, fill in these settings manually:

| Setting | Value |
|---------|-------|
| **Name** | `camera-zeroday` (or your preferred name) |
| **Environment** | `Node` |
| **Region** | Select closest to your users |
| **Branch** | `main` (or your deployment branch) |
| **Build Command** | `npm ci --include=dev && npm run build` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (or upgrade as needed) |

#### 5. Add Environment Variables
In the **"Environment"** section, add ONLY:

```env
VITE_PRIVACY_MODE=true
```

**Optional environment variables:**
```env
VITE_PATTERN_CODE=0-4-8            # Custom unlock pattern (e.g., 0-4-8)
VITE_DEBUG_MODE=false               # Disable debug logs
```

> ⚠️ **Important:** Do NOT set `NODE_ENV=production`. The build script needs `devDependencies` to compile Vite. The production environment will be set automatically.

#### 6. Deploy
1. Review all settings one more time
2. Click **"Create Web Service"**
3. Render will automatically start building (~2-3 minutes)
4. Monitor the deployment in the **"Logs"** tab
5. Once deployed, you'll get a URL like: `https://camera-zeroday.onrender.com`

**Deployment is complete!** Your app is now live and publicly accessible.

### Build Output
The build process creates:
- **`dist/`** — Production frontend bundle (Vite output)
- **`dist/index.cjs`** — Production server bundle (Express + static serving)

### Deployment Verification
After deployment completes:

✅ **Check Frontend**
- Open `https://your-app-name.onrender.com`
- Verify the 2048 game loads
- Test PWA install banner
- Try the camera permissions prompt

✅ **Check Features**
1. **Camera Interface** — Tap 5-tap pattern to unlock from game
2. **2048 Game** — Should be fully playable
3. **PWA Banner** — Should appear on game screen
4. **Settings** — All collapsible sections should work

### Important Deployment Notes

#### Free Tier Considerations
- **Spin-down** — Render puts free apps to sleep after 15 mins of inactivity
  - First request after sleep takes ~30 seconds to spin up
  - Consider upgrading to Starter plan for production
- **Storage** — IndexedDB data stored locally in browser, not affected by spin-down
- **Bandwidth** — 100 GB/month free (generous for this app)

#### HTTPS & Security
- Render automatically provides HTTPS
- Camera and Geolocation APIs require HTTPS
- All traffic is encrypted end-to-end

#### Data Privacy
- All photos stored locally in browser's IndexedDB
- No data sent to Render servers
- App works completely offline after first load
- Service Worker caches all assets

#### Custom Domain
To use a custom domain:
1. Go to **"Settings"** → **"Custom Domain"**
2. Add your domain name
3. Follow DNS configuration instructions
4. SSL certificate automatically provisioned by Render

### Troubleshooting Deployment

#### Build Fails

**Error: "Cannot find module 'vite'"**
- This happens if `NODE_ENV=production` is set during build
- **Solution:** Use the correct build command: `npm ci --include=dev && npm run build`
- Remove `NODE_ENV=production` from Render's environment variables
- Render will use `npm install --production` if NODE_ENV is set, skipping devDependencies

**Other build issues:**
```bash
# Check for TypeScript errors
npm run check

# Ensure Node version compatibility
node --version  # Should be 18+

# Clean install and rebuild locally
rm -rf node_modules dist
npm install
npm run build
```

If still failing, check Render logs for the exact error message.

#### App Won't Start

**Error: "Cannot find module 'dist/index.cjs'"**
- This means the build process didn't run successfully
- **Solution:** Check the build logs in Render Dashboard
- Ensure Build Command is: `npm ci --include=dev && npm run build`
- If the build command is missing, add it in Service Settings

**Other start issues:**
- Check logs: Render Dashboard → "Logs" tab
- Ensure Start Command is: `npm start`
- Verify `package.json` has build and start scripts defined
- Look for specific error messages in the logs

#### Camera/GPS Not Working
- Camera API requires HTTPS (Render provides this)
- Check browser console for permission errors
- Verify device has camera hardware
- Try in different browser if issues persist

#### PWA Won't Install
- App must be served over HTTPS ✅ (Render handles this)
- Manifest file must be valid
- Service Worker must register successfully
- Check browser console for SW errors

### Automatic Deployments & Git Integration
Render automatically redeploys when you push to the linked branch (default: `main`):

**How it works:**
1. Make changes locally
2. Commit and push to `main` branch
3. Render detects the push via GitHub webhook
4. Automatically rebuilds and redeploys the app
5. Your changes are live in ~2-3 minutes

**To disable auto-deploy:**
- Go to **Service Settings** → **"Auto-Deploy"** → Toggle off
- Manual deploys can still be triggered from the Dashboard

**Pull Request Previews (Optional):**
Render can automatically create preview instances for pull requests:
- Each PR gets its own preview URL
- Useful for testing changes before merging
- Enable in **"Settings"** → **"Preview Instances"** → **"Preview PR"**

### GitHub App Permissions
If Render can't access your repository, you may need to fix GitHub app permissions:

1. Visit [github.com/apps/render/installations/new](https://github.com/apps/render/installations/new)
2. Check **"Repository access"** section
3. Ensure Camera ZeroDay repository is included
4. Grant necessary permissions (read code, manage webhooks)
5. Return to Render Dashboard and retry deploy

**Common Issues:**
- Repository was made private after connecting
- GitHub app access revoked
- Repository moved to different organization

### Monitoring & Logs
View deployment logs:
1. Dashboard → Your Service
2. Click **"Logs"** tab
3. View real-time output
4. Search for errors

### Environment-Specific Configuration
The app detects deployment environment:
```javascript
// This is handled automatically
const isProduction = import.meta.env.MODE === 'production';
const privacyMode = import.meta.env.VITE_PRIVACY_MODE === 'true';
```

### Quick Deployment Checklist
Before deploying to Render, ensure you have:

- [ ] GitHub account with repository pushed to main branch
- [ ] Render.com account created
- [ ] Build Command: `npm ci --include=dev && npm run build`
- [ ] Start Command: `npm start`
- [ ] Only `VITE_PRIVACY_MODE=true` in environment variables
- [ ] NO `NODE_ENV=production` in Render environment
- [ ] Optional: `VITE_PATTERN_CODE` for custom pattern
- [ ] GitHub connection authorized and tested
- [ ] Free tier or paid plan selected based on needs

### Upgrading Beyond Free Tier

When ready to upgrade from free tier:
1. Dashboard → Your Service → **"Settings"**
2. Under **"Plan"** → Choose appropriate tier
3. Changes take effect immediately

**Recommended plans:**
- **Starter**: $7/month — Good for testing, occasional use
- **Standard**: $12/month — Recommended for production
- **Pro**: $19/month — For high traffic

### Key Differences from Local Development

| Aspect | Local | Render |
|--------|-------|--------|
| **Build Command** | `npm run build` | `npm ci --include=dev && npm run build` |
| **Environment** | Development | Production (auto) |
| **Data Storage** | Browser IndexedDB | Browser IndexedDB (same) |
| **Cold Start** | Instant | 30s on free tier (first request) |
| **HTTPS** | http://localhost:5000 | ✅ Automatic |
| **Camera API** | Works on localhost | ✅ Works over HTTPS |
| **Offline Mode** | Works offline | ✅ Service Worker caches everything |

---

## 📖 Usage Guide

### Taking Photos
1. **Launch Camera** — Open app and ensure you're not in privacy mode
2. **Frame Shot** — Position subject within reticle overlay
3. **Capture** — Tap the large capture button or press spacebar
4. **Confirm** — Review photo in preview, then save or retake

### Accessing Privacy Mode
1. **Start Game** — App opens directly to 2048 game
2. **Unlock Camera** — Quickly tap pattern (5 taps on 3×3 grid)
3. **Pattern Format** — Taps numbered 0-8:
   ```
   0 1 2
   3 4 5
   6 7 8
   ```
4. **Time Window** — Complete all 5 taps within 0.8 seconds

### Gallery Management
1. **View Photos** — Navigate to Gallery tab
2. **Open Photo** — Tap thumbnail to view full resolution and metadata
3. **Photo Details** — See GPS, heading, timestamp, and device orientation
4. **Export** — Right-click image for browser save options

### Settings Configuration
All settings are organized in collapsible sections:
- **Reticle Options** — Overlay type and appearance
- **GPS Settings** — Location tracking preferences
- **Camera Preferences** — Default device selection
- **Metadata Display** — Show/hide overlay information
- **Watermark Settings** — Add custom text overlays
- **Storage Management** — View usage and clear data
- **Privacy Configuration** — Unlock pattern setup
- **PWA Options** — Installation and offline settings

---

## 🏗️ Architecture

### Technology Stack
- **Frontend Framework** — React 18 with TypeScript
- **Build Tool** — Vite with HMR support
- **Routing** — Wouter (lightweight client-side router)
- **State Management** — TanStack Query + React Context
- **Styling** — Tailwind CSS + shadcn/ui components
- **Storage** — IndexedDB (browser-native database)
- **Icons** — Lucide React + React Icons
- **Utilities** — date-fns, zod, clsx, tailwind-merge

### Project Structure
```
camerazeroday/
├── client/src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── game-2048.tsx       # Privacy mode game
│   │   ├── pattern-lock.tsx    # Unlock pattern grid
│   │   └── collapsible-card.tsx # Settings sections
│   ├── pages/
│   │   ├── camera/             # Main camera interface
│   │   ├── gallery/            # Photo browser
│   │   ├── settings/           # Settings UI
│   │   └── game.tsx             # Game wrapper
│   ├── lib/
│   │   ├── db.ts               # IndexedDB abstraction
│   │   ├── privacy-context.tsx  # Privacy mode state
│   │   ├── i18n/               # Localization (EN/RU)
│   │   └── constants.ts        # App constants
│   ├── hooks/
│   │   ├── use-camera.ts       # Camera API integration
│   │   ├── use-geolocation.ts  # GPS positioning
│   │   ├── use-orientation.ts  # Device orientation
│   │   └── use-pwa.ts          # PWA installation
│   └── App.tsx                 # Main app component
├── server/
│   ├── index.ts                # Express server
│   └── vite.ts                 # Vite middleware
├── public/
│   └── manifest.json           # PWA manifest
└── package.json                # Dependencies
```

### Data Storage
All data persists in **IndexedDB** with the following stores:
- **photos** — Captured images with metadata
- **settings** — User preferences and configuration
- **gallery_cache** — Thumbnail generation cache

No cloud sync or server-side database required.

---

## 🔐 Security & Privacy

### Data Protection
- **Local-Only Storage** — All photos stored in browser's IndexedDB
- **No Cloud Upload** — Complete offline-first architecture
- **EXIF Removal** — Base64 encoding prevents sensitive metadata exposure
- **No Tracking** — Zero analytics or telemetry

### Pattern-Based Security
- **Custom Unlock Code** — User-defined pattern for privacy mode access
- **Time-Window Protection** — Must complete pattern within 0.8 seconds
- **Touch Debouncing** — Prevents accidental activation during gameplay
- **Quick-Tap Mechanism** — 5 consecutive taps required to unlock

---

## 🌍 Localization

Camera ZeroDay supports full bilingual interface:
- **English** — Default language
- **Русский** — Complete Russian translation
- **Auto-Detection** — Respects browser language preference
- **Manual Override** — Switch languages in settings

---

## 📋 Detailed Feature Documentation

### Configuration System
The app uses environment variables for deployment configuration:
- `VITE_PRIVACY_MODE` — Force privacy mode for all users
- `VITE_PATTERN_CODE` — Custom unlock pattern (development)
- `VITE_DEBUG_MODE` — Enhanced logging for troubleshooting

### Device APIs
- **Camera API** — MediaStream for photo capture
- **Geolocation API** — GPS positioning with accuracy metrics
- **Device Orientation API** — Compass and tilt sensors
- **Service Worker** — Offline caching and background sync

### Browser Compatibility
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Camera  | ✅ 90+ | ✅ 88+  | ✅ 15+ | ✅ 90+ |
| GPS     | ✅ 90+ | ✅ 88+  | ✅ 15+ | ✅ 90+ |
| PWA     | ✅ 90+ | ✅ 88+  | ⚠️ 15+ | ✅ 90+ |
| Service Worker | ✅ 90+ | ✅ 88+ | ✅ 15+ | ✅ 90+ |

---

## 🎮 2048 Game Guide

The privacy mode features a fully functional 2048 puzzle game:
- **Objective** — Combine tiles to reach 2048
- **Controls** — Swipe or use arrow keys
- **Score** — Cumulative points from merged tiles
- **Best Score** — Track your personal high score
- **Mobile Optimized** — Single-handed gameplay support
- **Touch-Friendly** — Large buttons for easy interaction

### Tips for Hiding the Camera
- Play the game normally to avoid suspicion
- Keep the best score visible
- Use landscape mode for immersive experience
- Dismiss PWA installation banner to reduce distractions
- Pattern unlock is safeguarded against accidental triggers

---

## 🛠️ Development

### Setup
```bash
npm install
npm run dev      # Start development server (Vite + Express)
npm run build    # Production build
npm run type-check  # TypeScript validation
```

### Code Style
- **TypeScript** — Strict type checking enabled
- **ESLint** — Code quality rules
- **Prettier** — Automatic code formatting
- **Tailwind CSS** — Utility-first styling

### Adding New Features
1. **Define Types** — Update shared schema if needed
2. **Create Components** — Use shadcn/ui primitives
3. **Add Hooks** — Custom hooks for complex logic
4. **Style with Tailwind** — Follow design system
5. **Test Thoroughly** — Verify on multiple browsers

---

## 📄 Documentation

- **Manual (Russian)** — `documents/manual_settings_privacy_ru.md`
- **Configuration** — `client/src/config.ts`
- **Localization** — `client/src/lib/i18n/`
- **API Hooks** — `client/src/hooks/`

---

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📝 License

This project is licensed under the MIT License — see LICENSE file for details.

---

## 🙏 Acknowledgments

- **shadcn/ui** — Beautiful component library
- **Tailwind CSS** — Modern utility-first styling
- **Vite** — Next generation build tool
- **React** — UI library foundation
- **Lucide Icons** — Beautiful icon set

---

## 📮 Support

For issues, questions, or suggestions:
- 🐛 **Bug Reports** — Create an issue on GitHub
- 💡 **Feature Requests** — Discuss in issues
- 📧 **Contact** — Check repository for contact info

---

## 🔮 Roadmap

- [ ] Cloud sync backend (optional)
- [ ] Advanced image filters
- [ ] Batch photo operations
- [ ] Custom theme creator
- [ ] Multi-pattern unlock codes
- [ ] Geofencing capabilities
- [ ] Real-time video recording
- [ ] Social sharing integration

---

**Camera ZeroDay** — *Precision photography meets tactical intelligence* 🎯

*Built with ❤️ for photographers, surveyors, and tactical professionals*

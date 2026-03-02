# Sound First Mobile - Testing Guide

## Overview

This app uses `react-native-live-audio-stream` for real-time pitch detection, which requires **native code**. This means you **cannot use Expo Go** - you must build a Development Client.

## Your Setup

| Device | Role | Notes |
|--------|------|-------|
| Windows PC | Main development | Code editing with Claude Opus 4.5 |
| MacBook Pro | iOS builds only | Minimal use - just for building |
| iPhone | Testing | Install dev builds from Mac |

---

## Quick Reference

### On Windows (Daily Development)

```powershell
# Start Metro bundler
cd c:\Users\360608\workspace\git-apps\sound-first-mobile
npx expo start --dev-client
```

This starts the JavaScript bundler. Your iPhone (with dev client installed) can connect to it.

### On Mac (Only When Rebuilding)

You only need the Mac when:
1. **First time setup** - initial dev client build
2. **Adding native packages** - after `npm install <native-package>`
3. **Updating app.json plugins** - native config changes

---

## One-Time Mac Setup

### 1. Install Prerequisites (Mac)

```bash
# Install Xcode from App Store (if not already)
# Then install command line tools:
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods

# Or with Homebrew:
brew install cocoapods
```

### 2. Clone/Sync the Project (Mac)

Option A - Git (recommended):
```bash
cd ~/workspace
git clone <your-repo-url>
cd sound-first-mobile
npm install
```

Option B - Copy from Windows:
- Use a USB drive, cloud sync, or network share to copy the `sound-first-mobile` folder

### 3. Build the Dev Client (Mac)

```bash
cd ~/workspace/sound-first-mobile

# Install dependencies
npm install

# Build and install on connected iPhone
npx expo run:ios --device
```

This will:
- Install CocoaPods dependencies
- Build the native iOS app
- Install it on your connected iPhone

**This takes 5-15 minutes the first time.**

---

## Daily Development Workflow

### Windows (Your Main Machine)

1. **Make code changes** with Claude Opus 4.5

2. **Start the bundler**:
   ```powershell
   cd c:\Users\360608\workspace\git-apps\sound-first-mobile
   npx expo start --dev-client
   ```

3. **Note your Windows IP address** (shown in terminal, or run `ipconfig`)

### iPhone

1. **Open the "Sound First" dev client app** (not Expo Go!)

2. **Enter the bundler URL**:
   - Format: `exp://YOUR_WINDOWS_IP:8081`
   - Example: `exp://192.168.1.100:8081`
   
   Or scan the QR code if on same network.

3. **Test your changes** - they hot-reload instantly!

---

## When You Need to Rebuild (Mac)

Only rebuild when you:
- Add a new native package (`npm install react-native-something`)
- Change `app.json` plugins section
- Get "Native module not found" errors

### Rebuild Steps (Mac)

1. **Sync your code** (git pull or copy files)

2. **Install dependencies**:
   ```bash
   cd ~/workspace/sound-first-mobile
   npm install
   ```

3. **Rebuild**:
   ```bash
   npx expo run:ios --device
   ```

---

## Network Configuration

For Windows bundler → iPhone connection:

### Same WiFi Network (Easiest)
Both devices on same network. Use Windows IP directly.

### Different Networks
Use Expo's tunnel mode:
```powershell
npx expo start --dev-client --tunnel
```
(Requires `npm install -g @expo/ngrok`)

### Firewall Issues
If iPhone can't connect, allow Node.js through Windows Firewall:
1. Windows Security → Firewall → Allow an app
2. Find/add Node.js and allow Private networks

---

## Troubleshooting

### "Native module not found" on iPhone
→ Rebuild on Mac: `npx expo run:ios --device`

### iPhone can't connect to Windows bundler
→ Check both devices are on same WiFi
→ Check Windows IP is correct
→ Try tunnel mode: `npx expo start --dev-client --tunnel`

### Build fails on Mac
```bash
# Clean and retry
cd ios
pod deintegrate
pod install
cd ..
npx expo run:ios --device
```

### Metro bundler port conflict
```powershell
# Use different port
npx expo start --dev-client --port 8082
```

---

## Alternative: EAS Build (No Mac Needed)

If you want to avoid using your Mac entirely, you can use Expo's cloud build service:

```powershell
# One-time setup
npm install -g eas-cli
eas login
eas build:configure

# Build iOS dev client in cloud
eas build --profile development --platform ios
```

**Pros**: No Mac needed for builds
**Cons**: 
- Requires Apple Developer account ($99/year)
- Build queue times (5-30 min)
- Limited free tier

---

## File Sync Options

Keep Windows and Mac in sync:

1. **Git (Recommended)**
   - Push from Windows, pull on Mac
   - Don't commit `node_modules` or `ios/Pods`

2. **Cloud Sync**
   - OneDrive, Dropbox, iCloud Drive
   - Exclude `node_modules` folder

3. **Network Share**
   - Share Windows folder, mount on Mac

---

## Summary Cheat Sheet

| Task | Where | Command |
|------|-------|---------|
| Edit code | Windows | VS Code + Claude |
| Run bundler | Windows | `npx expo start --dev-client` |
| Build iOS app | Mac | `npx expo run:ios --device` |
| Test app | iPhone | Open dev client, connect to bundler |
| Rebuild needed? | Mac | Only after native package changes |

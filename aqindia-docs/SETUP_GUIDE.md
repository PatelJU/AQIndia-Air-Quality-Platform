# AQIndia — Local Setup Guide

Complete step-by-step instructions for setting up AQIndia on your local machine.

---

## Prerequisites

### System Requirements

- **OS** — Windows 10+, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **RAM** — 4GB minimum (8GB recommended)
- **Disk Space** — 2GB free space
- **Internet** — Required for package downloads and live data

### Software Requirements

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 22.13.0+ | JavaScript runtime |
| **pnpm** | 10.4.1+ | Package manager (faster than npm) |
| **Python** | 3.11+ | Data generation scripts |
| **Git** | 2.30+ | Version control (optional) |

---

## Step 1: Install Node.js & pnpm

### Windows

1. Download Node.js from [nodejs.org](https://nodejs.org/) (LTS version)
2. Run the installer and follow prompts
3. Verify installation:
   ```bash
   node --version
   npm --version
   ```
4. Install pnpm globally:
   ```bash
   npm install -g pnpm
   pnpm --version
   ```

### macOS

```bash
# Using Homebrew
brew install node
brew install pnpm

# Verify
node --version
pnpm --version
```

### Linux (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Verify
node --version
pnpm --version
```

---

## Step 2: Install Python 3.11+

### Windows

1. Download from [python.org](https://www.python.org/downloads/)
2. Run installer, **check "Add Python to PATH"**
3. Verify:
   ```bash
   python --version
   pip --version
   ```

### macOS

```bash
brew install python@3.11
python3 --version
```

### Linux

```bash
sudo apt-get install python3.11 python3-pip
python3 --version
```

---

## Step 3: Extract & Setup Project

### 1. Extract the ZIP file

```bash
unzip aqindia-complete.zip
cd aqindia
```

### 2. Install Node dependencies

```bash
pnpm install
```

This will install all packages listed in `package.json` (~500MB download).

### 3. Install Python dependencies (optional, for data generation)

```bash
pip install pymannkendall scipy scikit-learn numpy pandas
```

---

## Step 4: Prepare Data

### Option A: Use Pre-generated Data (Recommended)

The project comes with pre-generated data files in `server/data/`. Skip to Step 5.

### Option B: Regenerate Data (Optional)

If you want to regenerate synthetic data:

```bash
python3 scripts/generate_all_data.py
```

This will create:
- `cities.json` — 108 cities metadata
- `recent_daily.json` — Latest AQI snapshot
- `ml_models.json` — Model metrics
- `cities_historical/` — Per-city historical data

---

## Step 5: Start Development Server

```bash
pnpm dev
```

You should see output like:

```
  VITE v7.1.7  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### Open in Browser

Visit: **http://localhost:3000**

You should see the AQIndia dashboard with:
- 108 cities loaded
- Live AQI data from Open-Meteo
- All 13 pages accessible from sidebar

---

## Step 6: Run Tests (Optional)

```bash
# Run all tests
pnpm test

# Expected output:
# ✓ server/auth.logout.test.ts (1 test)
# ✓ server/aqindia.test.ts (16 tests)
# Test Files  2 passed (2)
# Tests  17 passed (17)
```

---

## Step 7: Add API Keys (Optional)

To enable advanced features, add API keys in the Settings page:

### 1. Open Settings Page

Click **Settings** in the sidebar.

### 2. Add WAQI Key (Optional)

- Get key from [aqicn.org/data-platform/token](https://aqicn.org/data-platform/token/)
- Paste into "WAQI API Key" field
- Click "Save & Test"

### 3. Add Gemini Key (Optional)

- Get key from [aistudio.google.com](https://aistudio.google.com/app/apikey)
- Paste into "Gemini API Key" field
- Click "Save & Test"
- This enables AI validation of AQI data

### 4. Keys are Encrypted

Keys are stored **locally** using AES-256 encryption. They never leave your browser unencrypted.

---

## Troubleshooting

### Port 3000 Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3001 pnpm dev
```

### Module Not Found Errors

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Python Script Errors

```bash
# Ensure Python 3.11+
python3 --version

# Install missing packages
pip install pymannkendall scipy scikit-learn numpy pandas
```

### TypeScript Errors

```bash
# Check compilation
pnpm check

# If errors, rebuild
pnpm build
```

### Data Not Loading

1. Check browser console (F12) for errors
2. Verify `server/data/` directory exists with JSON files
3. Restart dev server: `pnpm dev`

---

## Project Structure Overview

```
aqindia/
├── client/              # React frontend
│   ├── src/
│   │   ├── pages/       # 13 page components
│   │   ├── components/  # Reusable UI
│   │   ├── lib/         # Utilities
│   │   └── index.css    # OLED theme
│   └── index.html
│
├── server/              # Express backend
│   ├── routers.ts       # tRPC API procedures
│   ├── db.ts            # Database queries
│   └── data/            # JSON data files
│
├── drizzle/             # Database schema
│   └── schema.ts
│
├── scripts/             # Utility scripts
│   └── generate_all_data.py
│
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── tailwind.config.ts   # Tailwind config
└── vite.config.ts       # Vite config
```

---

## Common Commands

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Check TypeScript
pnpm check

# Format code
pnpm format

# Generate data
python3 scripts/generate_all_data.py
```

---

## Database Setup (Advanced)

By default, the project uses an in-memory database. To use MySQL:

### 1. Install MySQL

```bash
# macOS
brew install mysql

# Ubuntu
sudo apt-get install mysql-server

# Windows
# Download from mysql.com
```

### 2. Create Database

```bash
mysql -u root -p
CREATE DATABASE aqindia;
EXIT;
```

### 3. Update .env

```env
DATABASE_URL=mysql://root:password@localhost:3306/aqindia
```

### 4. Run Migrations

```bash
pnpm db:push
```

---

## Next Steps

1. **Explore the code** — Start with `client/src/pages/Home.tsx`
2. **Read documentation** — Check other MD files in this package
3. **Modify & extend** — See UPGRADE_SUGGESTIONS.md for ideas
4. **Run tests** — Ensure everything works: `pnpm test`
5. **Build for production** — `pnpm build`

---

## Support & Issues

If you encounter issues:

1. Check the **Troubleshooting** section above
2. Review browser console (F12) for error messages
3. Check `server/data/` directory exists
4. Ensure all dependencies installed: `pnpm install`
5. Restart dev server: `pnpm dev`

---

## Performance Tips

### Faster Development

```bash
# Use faster package manager
pnpm install  # Already faster than npm

# Clear cache periodically
rm -rf node_modules/.vite
```

### Faster Builds

```bash
# Production build
pnpm build

# This creates optimized bundle in dist/
```

### Faster Data Loading

Data files are split by city in `server/data/cities_historical/` for better performance. The app loads only the data it needs.

---

## Security Notes

1. **API Keys** — Stored locally with AES-256 encryption
2. **Database** — Use strong passwords in production
3. **Environment Variables** — Never commit `.env` to git
4. **HTTPS** — Use HTTPS in production

---

## Next: Read Other Documentation

- **README.md** — Project overview
- **ARCHITECTURE.md** — System design
- **DATA_SOURCES.md** — API documentation
- **API_REFERENCE.md** — tRPC endpoints
- **UPGRADE_SUGGESTIONS.md** — Feature ideas

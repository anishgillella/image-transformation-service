# Phase 1: Project Setup

## Objective
Initialize both frontend and backend projects with all necessary dependencies and configurations.

---

## 1.1 Backend Setup

### Create Project Structure

```bash
mkdir backend
cd backend
npm init -y
```

### Install Dependencies

```bash
# Core
npm install express cors dotenv

# TypeScript
npm install -D typescript ts-node @types/node @types/express @types/cors

# Image Processing
npm install sharp multer
npm install -D @types/multer @types/sharp

# External Services
npm install cloudinary axios form-data

# Development
npm install -D nodemon
```

### Dependencies Explained

| Package | Purpose |
|---------|---------|
| `express` | Web server framework |
| `cors` | Enable cross-origin requests from frontend |
| `dotenv` | Load environment variables from .env |
| `typescript` | TypeScript compiler |
| `ts-node` | Run TypeScript directly |
| `sharp` | Image manipulation (flip) |
| `multer` | Handle file uploads |
| `cloudinary` | Image hosting SDK |
| `axios` | HTTP client for Remove.bg API |
| `form-data` | Build multipart form data for API calls |
| `nodemon` | Auto-restart server on changes |

### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Package.json Scripts

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

### Environment Variables

Create `.env`:

```env
PORT=3000
REMOVE_BG_API_KEY=your_api_key_here
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Create `.env.example` (for documentation):

```env
PORT=3000
REMOVE_BG_API_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Create Folder Structure

```
backend/
├── src/
│   ├── routes/
│   ├── services/
│   ├── middleware/
│   ├── types/
│   └── index.ts
├── .env
├── .env.example
├── .gitignore
├── package.json
└── tsconfig.json
```

### .gitignore

```
node_modules/
dist/
.env
*.log
```

### Basic Server Entry Point

Create `src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Verify Backend Setup

```bash
npm run dev
# Visit http://localhost:3000/api/health
# Should return: { "status": "ok", "timestamp": "..." }
```

---

## 1.2 Frontend Setup

### Create Vite Project

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
```

### Install Dependencies

```bash
# Core dependencies are included with Vite template

# Styling
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Animations
npm install framer-motion

# Icons
npm install lucide-react

# Notifications
npm install sonner

# HTTP Client (optional, can use fetch)
npm install axios
```

### Dependencies Explained

| Package | Purpose |
|---------|---------|
| `tailwindcss` | Utility-first CSS framework |
| `framer-motion` | Animation library |
| `lucide-react` | Icon library |
| `sonner` | Toast notifications |
| `axios` | HTTP client (cleaner than fetch) |

### Tailwind Configuration

Update `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        accent: '#0066FF',
        success: '#00C853',
        background: '#FAFAFA',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### Update CSS Entry Point

Replace `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

body {
  font-family: 'Inter', system-ui, sans-serif;
  background-color: #FAFAFA;
  color: #1A1A1A;
}
```

### Environment Variables

Create `.env`:

```env
VITE_API_URL=http://localhost:3000/api
```

### Create Folder Structure

```
frontend/
├── src/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── App.tsx
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── .env
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

### Verify Frontend Setup

```bash
npm run dev
# Visit http://localhost:5173
# Should see Vite + React default page
```

---

## 1.3 Verification Checklist

### Backend
- [ ] `npm run dev` starts server without errors
- [ ] `http://localhost:3000/api/health` returns JSON response
- [ ] TypeScript compiles without errors

### Frontend
- [ ] `npm run dev` starts dev server
- [ ] `http://localhost:5173` loads React app
- [ ] Tailwind classes work (test with a colored div)
- [ ] No console errors

---

## 1.4 Git Setup

From project root (`geneva/`):

```bash
# Add both projects
git add .
git commit -m "Phase 1: Initialize frontend and backend projects"
```

---

## Next Phase

Once both projects are running, proceed to **Phase 2: Backend Implementation** to build the API endpoints and service integrations.

# HireSense AI - Technical Documentation & Deployment Guide

HireSense AI is a React + Firebase client-side platform designed to parse resumes, perform automated ATS scoring and job matching, and evaluate candidate performance using mock interviews graded by Gemini AI.

---

## 1. System Architecture

```mermaid
graph TD
  User[Client Browser] --> AuthContext[Auth Context]
  User --> ThemeContext[Theme Context]
  User --> NotificationContext[Notification Context]

  subgraph Client App
    AuthContext --> RouteGuard[ProtectedRoute / AdminRoute]
    RouteGuard --> Pages[Pages / Components]
    Pages --> PDFParser[resumeParser.js - pdf.js worker]
    Pages --> GeminiService[geminiService.js - Gemini API]
    Pages --> FirestoreHelper[firestoreHelper.js - Cache Wrapper]
  end

  subgraph Cloud Backend (Firebase)
    FirestoreHelper --> Firestore[(Cloud Firestore)]
    Pages --> Storage[(Firebase Storage)]
    AuthContext --> FirebaseAuth[Firebase Authentication]
  end

  subgraph AI Orchestration (Google AI)
    GeminiService --> GeminiAPI[Gemini 1.5 Flash Model]
  end
```

---

## 2. Folder Structure

```
HireSense AI/
├── dist/                  # Compiled production bundles
├── public/                # Static public assets
├── src/
│   ├── components/        # Reusable UI widgets and layout views
│   │   ├── admin/         # Administrative route control views
│   │   ├── AtsScoreCard   # Renders resume ATS evaluations
│   │   └── ProtectedRoute # Route verification guards
│   ├── context/           # React State context providers (Auth, Theme, Notifications)
│   ├── hooks/             # Reactive custom hooks (useAuth, useSEO, etc.)
│   ├── pages/             # Route-level views (Dashboard, ResumeAnalysis, MockInterview, JobMatcher)
│   ├── routes/            # React-Router mappings
│   ├── services/          # Firebase integration APIs & Gemini endpoints
│   │   ├── firebase.js    # Firestore persistent cache initialization
│   │   ├── geminiService  # Reusable Gemini REST API handler
│   │   └── userService.js # User role validations and fallbacks
│   ├── utils/             # Functional modules (PDF generation, CSV exporters)
│   │   └── firestoreHelper.js # Timeout wrapper with retries & cache checks
│   ├── App.jsx            # Core application entry
│   ├── index.css          # Style setups
│   └── main.jsx           # App mount anchor
├── firestore.rules        # Production Firestore database rules
├── firestore.indexes.json # Index setups for createdAt collections
├── firebase.json          # Hosting configuration mapping for Firebase
├── vercel.json            # Deployment routing mapping for Vercel
├── vite.config.js         # Modular manual chunk configuration
└── package.json           # Scripts and package manifests
```

---

## 3. Environment Setup

To run this project, configure a `.env` file in the root directory.

```bash
# Firebase Credentials (Vite requires VITE_ prefix for client exposure)
VITE_FIREBASE_API_KEY=AIzaSyCPViiXkhxQ4KhX_CZHxvpEGGGfY_rqPW8
VITE_FIREBASE_AUTH_DOMAIN=hiresense-ai-4d791.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=hiresense-ai-4d791
VITE_FIREBASE_STORAGE_BUCKET=hiresense-ai-4d791.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=738270486650
VITE_FIREBASE_APP_ID=1:738270486650:web:9deb9fb8eede17129edbc3
VITE_FIREBASE_MEASUREMENT_ID=G-687FBD9W5Y

# Admin Email Registries (comma separated string)
VITE_ADMIN_EMAILS=rahulsaini6377711@gmail.com,admin@hiresense.ai

# Google Gemini API Credentials
VITE_GEMINI_API_KEY=AIzaSyYourGeminiApiKeyHere
```

---

## 4. Production Optimizations

The application implements standard React & build optimizations:
- **Code Splitting & Lazy Loading**: All route endpoints in `AppRoutes.jsx` utilize `React.lazy()` and `Suspense` loaders to split JS entry bundles.
- **Vite Asset Chunks**: Recharts, jsPDF, Framer Motion, and Firebase are compiled as separate vendor chunks (using `vite.config.js`), reducing initial loading times.
- **Web Worker Porting**: pdf.js worker assets are imported locally via Vite asset queries (`?url`), eliminating CORS conflicts and "fake worker" console warnings.
- **Robust Database Helper**: `firestoreHelper.js` encapsulates Firestore calls, offering **3 attempts of exponential backoff retry** and **4-second timeout limits**, falling back to offline Firestore Cache (`getDocFromCache`) seamlessly.

---

## 5. Deployment Guide

### A. Deploying to Vercel
Vercel handles routing redirects for single-page applications via `vercel.json` (already present in the repository).

1. Install the Vercel CLI locally:
   ```bash
   npm install -g vercel
   ```
2. Authenticate and link your project:
   ```bash
   vercel login
   vercel link
   ```
3. Set your production environment variables inside the Vercel dashboard:
   * Go to **Project Settings** > **Environment Variables** and add all variables listed in the Environment Setup section.
4. Deploy the build:
   ```bash
   vercel --prod
   ```

### B. Deploying to Firebase Hosting
Firebase is configured via `firebase.json` and `.firebaserc` (already present in the repository).

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Log into your Firebase account:
   ```bash
   firebase login
   ```
3. Initialize the deployment target (our project `hiresense-ai-4d791` is default):
   ```bash
   firebase use default
   ```
4. Build the production build locally:
   ```bash
   npm run build
   ```
5. Deploy Hosting targets:
   ```bash
   firebase deploy --only hosting
   ```

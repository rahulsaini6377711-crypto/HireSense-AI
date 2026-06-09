# 📑 HireSense AI - File Index

## Project Statistics
- **Total JavaScript/JSX Files**: 31
- **Components**: 8
- **Pages**: 9
- **Services**: 4
- **Config Files**: 5
- **Documentation Files**: 5

## Directory Structure

### Root Level Files
```
📄 package.json              - NPM dependencies and scripts
📄 vite.config.js            - Vite build configuration
📄 tailwind.config.js        - Tailwind CSS theme configuration
📄 postcss.config.js         - PostCSS configuration
📄 .env.example              - Environment variables template
📄 .gitignore                - Git ignore rules
📄 .npmrc                    - NPM configuration
📄 index.html                - HTML template
📄 README.md                 - Complete documentation
📄 SETUP_GUIDE.md            - Detailed setup instructions
📄 QUICKSTART.md             - Quick start guide
📄 DEPLOYMENT.md             - Deployment guide
📄 PROJECT_SUMMARY.md        - Project summary
📄 FILE_INDEX.md             - This file
```

### src/ Directory

#### src/components/ (8 files)
```
📄 Navbar.jsx               - Navigation bar with auth support
📄 Sidebar.jsx              - Dashboard sidebar navigation
📄 Footer.jsx               - Application footer
📄 ProtectedRoute.jsx       - Route protection component
📄 LoadingSpinner.jsx       - Loading indicator
📄 ScoreCard.jsx            - Animated score display card
📄 ResumeUploader.jsx       - Resume upload with drag & drop
📄 InterviewCard.jsx        - Interview practice card
```

#### src/pages/ (9 files)
```
📄 Home.jsx                 - Landing page
📄 Login.jsx                - User login page
📄 Register.jsx             - User registration page
📄 Dashboard.jsx            - Main dashboard
📄 ResumeAnalysis.jsx       - Resume analysis page
📄 InterviewPrep.jsx        - Interview preparation page
📄 JobMatcher.jsx           - Job matching page
📄 Profile.jsx              - User profile page
📄 NotFound.jsx             - 404 error page
```

#### src/context/ (1 file)
```
📄 AuthContext.jsx          - Authentication context provider
```

#### src/hooks/ (1 file)
```
📄 useAuth.js               - Custom authentication hook
```

#### src/services/ (4 files)
```
📄 firebase.js              - Firebase initialization & config
📄 openai.js                - OpenAI API integration
📄 resumeParser.js          - Resume parsing service
📄 api.js                   - General API service layer
```

#### src/routes/ (1 file)
```
📄 AppRoutes.jsx            - Application route configuration
```

#### src/utils/ (3 files)
```
📄 constants.js             - Application constants
📄 helpers.js               - Helper utility functions
📄 validators.js            - Form validation functions
```

#### src/layouts/ (2 files)
```
📄 MainLayout.jsx           - Main layout with navbar & footer
📄 DashboardLayout.jsx      - Dashboard layout with sidebar
```

#### src/ Root Files (2 files)
```
📄 App.jsx                  - Main application component
📄 main.jsx                 - React entry point
📄 index.css                - Global styles with Tailwind
```

#### src/assets/ (1 folder)
```
📁 assets/                  - Static assets (images, fonts, etc.)
```

### dist/ Directory (Generated)
```
📁 dist/                    - Production build output
  📁 assets/               - Optimized assets
  📄 index.html            - Built HTML
```

### node_modules/ (Generated)
```
📁 node_modules/           - All npm dependencies (~450+ packages)
```

---

## Component Hierarchy

```
App
├── AuthProvider (Context)
│   └── BrowserRouter
│       ├── MainLayout
│       │   ├── Navbar
│       │   ├── Home (/)
│       │   │   ├── Hero Section
│       │   │   ├── Features Section
│       │   │   └── CTA Section
│       │   ├── Login (/login)
│       │   ├── Register (/register)
│       │   ├── NotFound (/*) 
│       │   └── Footer
│       │
│       ├── DashboardLayout (Protected)
│       │   ├── Navbar
│       │   ├── Sidebar
│       │   ├── Dashboard (/dashboard)
│       │   ├── ResumeAnalysis (/resume-analysis)
│       │   │   ├── ResumeUploader
│       │   │   └── ScoreCard (3x)
│       │   ├── InterviewPrep (/interview-prep)
│       │   │   └── InterviewCard (6x)
│       │   ├── JobMatcher (/job-matcher)
│       │   └── Profile (/profile)
│       │
│       └── LoadingSpinner (Auth Loading)
│
└── Toaster (React Hot Toast)
```

---

## File Dependencies

### Page Dependencies
- **Home.jsx** → Footer, Navbar (via MainLayout)
- **Login.jsx** → useAuth hook
- **Register.jsx** → useAuth hook
- **Dashboard.jsx** → ScoreCard
- **ResumeAnalysis.jsx** → ResumeUploader, ScoreCard
- **InterviewPrep.jsx** → InterviewCard
- **JobMatcher.jsx** → No component dependencies
- **Profile.jsx** → No component dependencies
- **NotFound.jsx** → No component dependencies

### Service Dependencies
- **App.jsx** → FirebaseApp, Toaster
- **AuthContext.jsx** → Firebase auth
- **useAuth.js** → AuthContext
- **All Pages (Protected)** → useAuth hook

### Utility Dependencies
- **All validation forms** → validators.js
- **Score calculations** → helpers.js
- **UI text/endpoints** → constants.js

---

## Configuration Files Explained

### vite.config.js
- Defines React plugin
- Sets dev server port to 5173
- Auto-opens browser on dev start

### tailwind.config.js
- Custom color palette (primary, secondary, accent)
- Custom animations (fadeIn, slideIn)
- Dark mode enabled
- Content paths configured

### postcss.config.js
- Tailwind CSS plugin
- Autoprefixer for cross-browser support

### package.json
- **dependencies**: React, Firebase, Framer Motion, etc.
- **devDependencies**: Vite, Tailwind, TypeScript types
- **scripts**: dev, build, preview, lint

### .env.example
- Firebase configuration variables
- API base URL
- Environment template (copy to .env.local)

---

## Quick File Reference

### To Add a New Page
1. Create file in `src/pages/NewPage.jsx`
2. Add route in `src/routes/AppRoutes.jsx`
3. Import components from `src/components/`
4. Use hooks from `src/hooks/`

### To Add a New Component
1. Create file in `src/components/NewComponent.jsx`
2. Use in any page that needs it
3. Add props for customization
4. Export as default

### To Add Utility Functions
1. Add to appropriate file in `src/utils/`
2. Export functions
3. Import where needed

### To Call APIs
1. Use services from `src/services/`
2. Or create new service file
3. Import and use in components

### To Add Form Validation
1. Add validator in `src/utils/validators.js`
2. Import and use in forms
3. Display errors with toast notifications

---

## Important File Locations

| Need | File | Location |
|------|------|----------|
| Authentication | AuthContext.jsx | src/context/ |
| Auth Hook | useAuth.js | src/hooks/ |
| Firebase Config | firebase.js | src/services/ |
| Routes | AppRoutes.jsx | src/routes/ |
| Theme Colors | tailwind.config.js | Root |
| Global Styles | index.css | src/ |
| App Entry | main.jsx | src/ |
| Setup Help | SETUP_GUIDE.md | Root |
| Quick Start | QUICKSTART.md | Root |

---

## Build Output

```
dist/
├── index.html               (0.74 KB)
├── assets/
│   ├── index-*.css          (26.04 KB, 5.24 KB gzipped)
│   └── index-*.js           (653.01 KB, 181.82 KB gzipped)
└── (All optimized & minified)
```

Total Gzipped Size: **~186 KB** (excellent for a full SaaS app!)

---

## File Statistics

| Category | Count | Files |
|----------|-------|-------|
| Components | 8 | Navbar, Sidebar, Footer, etc. |
| Pages | 9 | Home, Login, Dashboard, etc. |
| Services | 4 | Firebase, OpenAI, API, Parser |
| Utils | 3 | Constants, Helpers, Validators |
| Hooks | 1 | useAuth |
| Contexts | 1 | AuthContext |
| Layouts | 2 | MainLayout, DashboardLayout |
| Routes | 1 | AppRoutes |
| Config | 5 | Vite, Tailwind, PostCSS, etc. |
| Docs | 5 | README, Setup, Quick Start, etc. |
| **Total** | **~38** | **JavaScript/JSX + Config** |

---

## How to Navigate

1. **Start Developing**: Read `QUICKSTART.md`
2. **Detailed Setup**: Read `SETUP_GUIDE.md`
3. **Deployment**: Read `DEPLOYMENT.md`
4. **Full Info**: Read `README.md`
5. **Project Overview**: Read `PROJECT_SUMMARY.md`
6. **File Locations**: Read this file (`FILE_INDEX.md`)

---

## Next Steps

1. Copy `.env.example` to `.env.local`
2. Add Firebase credentials
3. Run `npm run dev`
4. Start developing!

---

**All files are organized, documented, and ready for development!** ✨

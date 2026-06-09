# HireSense AI - Setup & Installation Guide

## 🎯 Project Overview

HireSense AI is a modern, production-ready React + Vite application designed to help job seekers analyze their resumes, check ATS compatibility, and prepare for interviews using AI-powered insights.

## ✅ Project Setup Complete

All project files, configurations, and dependencies have been successfully installed!

### What's Included

- ✅ **Complete folder structure** with best practices
- ✅ **React 19** with hooks and context API
- ✅ **Vite** for fast development and optimized builds
- ✅ **Tailwind CSS** for utility-first styling
- ✅ **React Router DOM** for client-side routing
- ✅ **Firebase** authentication and services
- ✅ **Framer Motion** for smooth animations
- ✅ **React Icons** for professional icons
- ✅ **Recharts** for data visualization
- ✅ **React Hot Toast** for notifications
- ✅ **Production build** ready (dist folder generated)

## 📋 Project Structure

```
HireSense AI/
├── src/
│   ├── assets/              # Static assets (images, fonts)
│   ├── components/          # Reusable UI components
│   │   ├── Navbar.jsx       # Navigation bar
│   │   ├── Sidebar.jsx      # Dashboard sidebar
│   │   ├── Footer.jsx       # Footer component
│   │   ├── ProtectedRoute.jsx # Route guard
│   │   ├── LoadingSpinner.jsx # Loading indicator
│   │   ├── ScoreCard.jsx    # Score display card
│   │   ├── ResumeUploader.jsx # Resume upload component
│   │   └── InterviewCard.jsx  # Interview practice card
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Landing page
│   │   ├── Login.jsx        # Login page
│   │   ├── Register.jsx     # Registration page
│   │   ├── Dashboard.jsx    # Main dashboard
│   │   ├── ResumeAnalysis.jsx # Resume analysis page
│   │   ├── InterviewPrep.jsx  # Interview prep page
│   │   ├── JobMatcher.jsx   # Job matching page
│   │   ├── Profile.jsx      # User profile page
│   │   └── NotFound.jsx     # 404 page
│   ├── context/             # React Context
│   │   └── AuthContext.jsx  # Authentication context
│   ├── hooks/               # Custom hooks
│   │   └── useAuth.js       # Auth hook
│   ├── services/            # API services
│   │   ├── firebase.js      # Firebase config
│   │   ├── openai.js        # OpenAI API calls
│   │   ├── resumeParser.js  # Resume parsing
│   │   └── api.js           # General API calls
│   ├── routes/              # Route configuration
│   │   └── AppRoutes.jsx    # All routes
│   ├── utils/               # Utility functions
│   │   ├── constants.js     # App constants
│   │   ├── helpers.js       # Helper functions
│   │   └── validators.js    # Form validators
│   ├── layouts/             # Layout components
│   │   ├── MainLayout.jsx   # Main layout
│   │   └── DashboardLayout.jsx # Dashboard layout
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # React entry point
│   └── index.css            # Global styles
├── dist/                    # Production build (generated)
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.js           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── .env.example             # Environment template
├── .gitignore               # Git ignore rules
├── .npmrc                   # NPM configuration
├── README.md                # Project documentation
└── SETUP_GUIDE.md          # This file
```

## 🚀 Available Commands

### Development

```bash
# Start development server (auto-opens in browser)
npm run dev
```

Server runs at: `http://localhost:5173`

### Production

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Code Quality

```bash
# Run ESLint
npm run lint
```

## 🔧 Configuration Files

### 1. **vite.config.js** - Build Tool Configuration
- React plugin for JSX support
- Development server on port 5173
- Auto-open browser on dev

### 2. **tailwind.config.js** - Styling Configuration
- Custom color gradients
- Animation extensions
- Dark mode support
- Responsive design presets

### 3. **postcss.config.js** - CSS Processing
- Tailwind CSS plugin
- Autoprefixer for browser compatibility

### 4. **.env.example** - Environment Variables Template
Copy this file to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Then update with your configuration:

```
VITE_FIREBASE_API_KEY=your_firebase_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:3000/api
```

## 🔐 Firebase Setup Instructions

1. **Create Firebase Project**
   - Go to [firebase.google.com](https://firebase.google.com)
   - Click "Get Started" and create a new project

2. **Enable Authentication**
   - In Firebase Console, go to Authentication
   - Click "Get Started"
   - Enable "Email/Password" sign-in method

3. **Get Your Credentials**
   - Go to Project Settings
   - Copy your Web API credentials
   - Add to `.env.local`

## 🎨 Theming & Styling

### Dark Mode
Built-in dark mode support using Tailwind's dark mode class:

```html
<!-- Toggle dark mode -->
<html class="dark">
```

### Custom Colors
Edit `tailwind.config.js` to customize:
- Primary color: Blue (#3b82f6)
- Secondary color: Purple (#8b5cf6)
- Accent color: Pink (#ec4899)

### Animations
Pre-configured animations:
- `fadeIn` - Fade in effect
- `slideIn` - Slide in effect
- Custom Framer Motion animations

## 📱 Responsive Design

- **Mobile First**: Optimized for all screen sizes
- **Breakpoints**: sm, md, lg, xl, 2xl
- **Sidebar Navigation**: Hidden on mobile, toggle menu
- **Responsive Grid**: Adapts to screen size

## 🔄 Page Routes

### Public Routes
- `/` - Home page
- `/login` - User login
- `/register` - User registration

### Protected Routes (Requires Authentication)
- `/dashboard` - Main dashboard
- `/resume-analysis` - Resume analysis
- `/interview-prep` - Interview preparation
- `/job-matcher` - Job matching
- `/profile` - User profile

### Error Routes
- `/404` or any undefined route - Not found page

## 🛠️ Development Workflow

### 1. Start Development Server
```bash
npm run dev
```

### 2. Make Changes
- Edit files in `src/`
- Hot reload happens automatically

### 3. Test Components
- Open browser at `http://localhost:5173`
- Check console for errors

### 4. Build for Production
```bash
npm run build
```

### 5. Deploy
See deployment section below

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel
```

### Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy
```

### GitHub Pages

```bash
# Build
npm run build

# Deploy dist folder to GitHub Pages
```

## 🎯 Key Features

### Authentication
- Email/password registration and login
- Firebase session persistence
- Protected routes with `<ProtectedRoute>` component

### Resume Analysis
- File upload with validation
- Drag and drop support
- ATS score calculation
- Improvement recommendations

### Interview Preparation
- Multiple job roles
- Difficulty levels (easy, medium, hard)
- AI-generated questions
- Practice tracking

### Job Matching
- Skill-based job recommendations
- Match score calculation
- Location and salary display
- Job details view

### User Profile
- Profile information management
- Skills display
- Account settings
- Profile editing

## 📊 Performance

- **Code Splitting**: Automatic with React Router
- **Lazy Loading**: Routes load on demand
- **CSS Minification**: Tailwind JIT compilation
- **Image Optimization**: Consider using next-image or similar
- **Bundle Size**: ~180KB gzipped (can be optimized further)

## 🐛 Troubleshooting

### Issue: Dependencies not installing
**Solution**: Use `--legacy-peer-deps` flag
```bash
npm install --legacy-peer-deps
```

### Issue: Port 5173 already in use
**Solution**: Change port in `vite.config.js`
```javascript
server: {
  port: 3000 // Use different port
}
```

### Issue: Tailwind styles not applying
**Solution**: Restart dev server and clear browser cache
```bash
npm run dev
```

### Issue: Firebase authentication not working
**Solution**: Verify `.env.local` has correct Firebase credentials

## 📚 Documentation & Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Framer Motion](https://www.framer.com/motion/)
- [React Icons](https://react-icons.github.io/react-icons/)

## 🤝 Contributing

To contribute to this project:

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is open source and available under the MIT License.

## 🎓 Next Steps

1. ✅ **Project Created** - All files are in place
2. ✅ **Dependencies Installed** - npm modules ready
3. ✅ **Build Verified** - Production build successful
4. **Next**: Configure Firebase credentials in `.env.local`
5. **Then**: Start development with `npm run dev`
6. **Finally**: Deploy to your preferred hosting

## ✨ Ready to Go!

Your HireSense AI project is now ready for development. Start the dev server with:

```bash
npm run dev
```

The application will open automatically at `http://localhost:5173`

---

**Made with ❤️ by HireSense AI Team**

For questions or issues, refer to the README.md or create an issue in your repository.

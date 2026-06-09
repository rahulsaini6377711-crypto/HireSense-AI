# 🚀 HireSense AI - Quick Start Guide

## 5-Minute Setup

### Step 1: Navigate to Project
```bash
cd "c:\py\HireSense AI"
```

### Step 2: Set Up Environment
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials:
```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:3000/api
```

### Step 3: Start Development Server
```bash
npm run dev
```

Server starts at: **http://localhost:5173** (opens automatically)

## 📝 What You Can Do Right Now

### ✅ Fully Functional Features
- **Home Page**: Modern landing page with hero section and features
- **Authentication**: Registration and login pages (needs Firebase credentials)
- **Dashboard**: User dashboard with statistics
- **Resume Analysis**: Upload and analyze resumes
- **Interview Prep**: Browse interview questions by role
- **Job Matcher**: View matching job opportunities
- **User Profile**: View and edit profile information
- **Dark Mode**: Toggle dark mode throughout the app
- **Responsive Design**: Works on all devices

### 🔧 Configuration Required
- Firebase authentication credentials
- API endpoints for resume analysis
- OpenAI API (for actual AI features)

## 📦 Build for Production

```bash
npm run build
```

Creates optimized build in `dist/` folder ready for deployment.

## 🚀 Deploy Instantly

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## 📁 Project Structure at a Glance

- **src/pages/** - 9 pages including Home, Dashboard, and analysis tools
- **src/components/** - 8 reusable components
- **src/services/** - Firebase and API integrations
- **src/utils/** - Helpers, validators, constants
- **tailwind.config.js** - Complete theme configuration
- **index.html** - Main HTML file

## 🎨 Customization

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: '#3b82f6',    // Blue
  secondary: '#8b5cf6',  // Purple
  accent: '#ec4899',     // Pink
}
```

### Add Pages
1. Create file in `src/pages/`
2. Add route in `src/routes/AppRoutes.jsx`
3. Import and use components

### Add Components
1. Create file in `src/components/`
2. Import in your pages
3. Use and customize

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Page not loading | Check browser console (F12) for errors |
| Tailwind styles missing | Restart dev server: `npm run dev` |
| Firebase not working | Verify `.env.local` credentials |
| Port 5173 in use | Change port in `vite.config.js` |

## 📚 Documentation

- **Full Setup**: See [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **Project Info**: See [README.md](README.md)
- **Code Examples**: Check existing components in `src/components/`

## ⚡ Performance Tips

- Use `npm run build` to check bundle size
- Use React DevTools browser extension
- Check Lighthouse scores in DevTools
- Use Code Splitting with React.lazy()

## 🎯 Next Tasks

- [ ] Add Firebase credentials to `.env.local`
- [ ] Customize theme colors
- [ ] Set up API endpoints
- [ ] Test all pages in browser
- [ ] Deploy to Vercel or Netlify
- [ ] Set up custom domain

## 💡 Pro Tips

1. **Use DevTools**: F12 → React tab for component debugging
2. **Hot Reload**: Changes save automatically in dev mode
3. **Dark Mode**: Test with `.dark` class in DevTools console
4. **Mobile View**: Use DevTools device toggle (Ctrl+Shift+M)
5. **Network Throttling**: Simulate slow connections in DevTools

## 📞 Support

For detailed documentation, see:
- `README.md` - Full project documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `src/` - Well-commented source code

---

**Your HireSense AI project is ready to customize and deploy!** 🎉

Start with: `npm run dev`

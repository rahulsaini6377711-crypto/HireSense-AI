# 🚀 HireSense AI - Deployment Guide

## Overview

Your HireSense AI application is production-ready! This guide covers deployment to popular platforms.

## Pre-Deployment Checklist

- [ ] All Firebase credentials configured in `.env.local`
- [ ] API endpoints configured
- [ ] App tested locally with `npm run dev`
- [ ] Build successful with `npm run build`
- [ ] No console errors in DevTools
- [ ] Responsive design tested on mobile
- [ ] Dark mode working correctly

## Build Optimization

Before deploying, optimize your build:

```bash
npm run build
```

The build is configured with Rollup Manual Chunks optimization inside [vite.config.js](file:///c:/py/HireSense%20AI/vite.config.js) to split vendors (`firebase`, `recharts`, `pdfjs-dist`, `framer-motion`, and `jspdf`) into isolated cached blocks, ensuring initial page load sizes remain under 200KB.

### Static Route Redirection Configuration
To prevent 404 page refreshes on client-side routing, we include ready-to-deploy SPA redirections:
- **Vercel**: Configured in [vercel.json](file:///c:/py/HireSense%20AI/vercel.json)
- **Netlify**: Configured in [netlify.toml](file:///c:/py/HireSense%20AI/netlify.toml)

## Deployment Options

### 1. ✅ Vercel (Recommended - Easiest)

**Pros**: Auto-deploy from Git, serverless functions, edge network

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Connect GitHub account
# - Select project
# - Configure build settings (auto-detected)
# - Deploy!
```

**Environment Variables**:
1. Go to your Vercel project settings
2. Add Environment Variables
3. Copy from `.env.local`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_API_BASE_URL`

### 2. Netlify

**Pros**: Git integration, CI/CD pipeline, drag & drop

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Connect to Netlify
netlify init

# Follow prompts:
# - Choose "Create & configure a new site"
# - Select team
# - Site name
# - Deploy!
```

**Or Drag & Drop**:
1. Build locally: `npm run build`
2. Go to [app.netlify.com](https://app.netlify.com)
3. Drag `dist` folder to deploy area
4. Netlify automatically deploys!

### 3. GitHub Pages

**Pros**: Free hosting, easy updates

1. Update `vite.config.js`:
```javascript
export default defineConfig({
  base: '/repository-name/', // Your repo name
  plugins: [react()],
})
```

2. Build and deploy:
```bash
npm run build
git add dist
git commit -m "Deploy to GitHub Pages"
git push
```

3. Enable GitHub Pages in repository settings

### 4. Firebase Hosting

**Pros**: Same Firebase project, automatic SSL

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize
firebase init hosting

# Deploy
firebase deploy --only hosting
```

### 5. AWS S3 + CloudFront

**Pros**: High performance, global CDN

```bash
# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://your-bucket-name

# Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

### 6. Docker Deployment

**Create Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview"]
```

**Deploy to any container platform** (Docker Hub, AWS ECS, etc.)

## Post-Deployment Setup

### 1. Firebase Security Rules

Secure your Firestore database:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own documents
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Public read for resumes
    match /resumes/{document=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 2. Domain Configuration

#### For Vercel:
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

#### For Netlify:
1. Site settings → Domain management
2. Add custom domain
3. Update DNS records

### 3. SSL Certificate

Most platforms provide free SSL:
- ✅ Vercel - Automatic
- ✅ Netlify - Automatic
- ✅ GitHub Pages - Automatic
- ✅ Firebase Hosting - Automatic

### 4. Environment Variables

Set these on your hosting platform:

```
VITE_FIREBASE_API_KEY=xxx
VITE_FIREBASE_AUTH_DOMAIN=xxx
VITE_FIREBASE_PROJECT_ID=xxx
VITE_FIREBASE_STORAGE_BUCKET=xxx
VITE_FIREBASE_MESSAGING_SENDER_ID=xxx
VITE_FIREBASE_APP_ID=xxx
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

## Monitoring & Analytics

### Add Firebase Analytics

```javascript
// In App.jsx
import { initializeAnalytics } from 'firebase/analytics';
import { app } from './services/firebase';

const analytics = initializeAnalytics(app);
```

### Add Sentry for Error Tracking

```bash
npm install @sentry/react
```

```javascript
// In main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

### Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain
3. Verify with meta tag or DNS
4. Monitor search performance

## Performance Optimization

### 1. Enable Compression
Most platforms do this automatically.

### 2. Caching Strategy

**index.html** - No cache (always fresh)
**assets/** - Long-term cache (1 year)

Vercel/Netlify handle this automatically.

### 3. Image Optimization

Replace with optimized images:
```bash
npm install -D @vitejs/plugin-vue-imagemin
```

### 4. Code Splitting

Already configured with React Router! Routes load on demand.

## Continuous Deployment

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci --legacy-peer-deps
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Troubleshooting

### Build fails on platform
- Check Node.js version (use 18+)
- Check npm cache: `npm cache clean --force`
- Use: `npm ci --legacy-peer-deps`

### Environment variables not loading
- Double-check variable names (case-sensitive)
- Prefix with `VITE_` for Vite to expose them
- Restart build after adding variables

### Firebase not working after deploy
- Verify Firebase auth domain settings
- Check allowed domains in Firebase console
- Enable required Firebase services

### Slow performance
- Check bundle size: `npm run build` and review output
- Enable gzip compression
- Use CDN for static assets
- Consider code splitting

## Monitoring Checklist

After deployment:

- [ ] Test all pages load correctly
- [ ] Authentication works (register/login)
- [ ] Firebase data syncs properly
- [ ] Images load quickly
- [ ] No console errors
- [ ] Mobile view responsive
- [ ] Dark mode works
- [ ] Forms submit successfully
- [ ] Error pages display (404, etc.)
- [ ] Performance is acceptable

## Rollback Procedure

### Vercel
1. Go to Deployments
2. Click on previous version
3. Click "Promote to Production"

### Netlify
1. Go to Deploys
2. Find previous deploy
3. Click "Publish deploy"

### GitHub Pages
1. Revert commit: `git revert <commit-hash>`
2. Push to main branch
3. GitHub Pages automatically redeploys

## Scale Your Application

As traffic increases:

1. **Database**: Firebase handles scaling
2. **API**: Consider dedicated backend with Express.js
3. **CDN**: Add CloudFlare or AWS CloudFront
4. **Monitoring**: Set up alerts for errors/performance

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Firebase Deployment Guide](https://firebase.google.com/docs/hosting)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)

---

**Your HireSense AI application is ready for the world! Choose your deployment platform and go live.** 🎉

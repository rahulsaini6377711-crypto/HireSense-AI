# HireSense AI - AI-Powered Resume Analysis & Interview Preparation Platform

A modern, production-ready web application for analyzing resumes, improving ATS scores, and preparing for interviews using AI technology.

## 🚀 Features

- **Resume Analysis**: Get AI-powered insights on your resume
- **ATS Score**: Check your resume's Applicant Tracking System compatibility
- **Interview Preparation**: Practice with AI-generated interview questions
- **Job Matcher**: Find jobs that match your skills and experience
- **User Authentication**: Secure Firebase authentication
- **Dark Mode**: Modern dark mode support
- **Responsive Design**: Works perfectly on all devices
- **Smooth Animations**: Beautiful Framer Motion animations
- **Real-time Notifications**: React Hot Toast notifications

## 📋 Tech Stack

- **Frontend Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **Backend**: Firebase
- **Animations**: Framer Motion
- **Icons**: React Icons
- **Charts**: Recharts
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
src/
├── assets/                 # Static assets
├── components/             # Reusable components
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   ├── Footer.jsx
│   ├── ProtectedRoute.jsx
│   ├── LoadingSpinner.jsx
│   ├── ScoreCard.jsx
│   ├── ResumeUploader.jsx
│   └── InterviewCard.jsx
├── pages/                  # Page components
│   ├── Home.jsx
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Dashboard.jsx
│   ├── ResumeAnalysis.jsx
│   ├── InterviewPrep.jsx
│   ├── JobMatcher.jsx
│   ├── Profile.jsx
│   └── NotFound.jsx
├── context/                # React Context
│   └── AuthContext.jsx
├── hooks/                  # Custom hooks
│   └── useAuth.js
├── services/               # API services
│   ├── firebase.js
│   ├── openai.js
│   ├── resumeParser.js
│   └── api.js
├── routes/                 # Route configuration
│   └── AppRoutes.jsx
├── utils/                  # Utility functions
│   ├── constants.js
│   ├── helpers.js
│   └── validators.js
├── layouts/                # Layout components
│   ├── MainLayout.jsx
│   └── DashboardLayout.jsx
├── App.jsx                 # Main app component
├── main.jsx                # Entry point
└── index.css               # Global styles
```

## 🛠️ Installation

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Setup Instructions

1. **Clone the repository**
```bash
git clone <repository-url>
cd hiresense-ai
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your Firebase credentials and API configuration:

```
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:3000/api
```

4. **Start development server**
```bash
npm run dev
```

The application will open at `http://localhost:5173`

## 📦 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linter
npm run lint
```

## 🔐 Authentication

The application uses Firebase Authentication with support for:
- Email/Password registration
- Email/Password login
- Session persistence
- Protected routes

## 🎨 Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Dark Mode**: Built-in dark mode support using Tailwind's dark mode class
- **Custom Animations**: Tailwind animations + Framer Motion
- **Responsive**: Mobile-first responsive design

## 🔌 Firebase Setup

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password)
3. Copy your credentials
4. Add credentials to `.env.local`

## 📱 Pages Overview

### Public Pages
- **Home**: Landing page with features and CTA
- **Login**: User login page
- **Register**: User registration page

### Protected Pages
- **Dashboard**: Overview of user statistics and quick actions
- **Resume Analysis**: Upload and analyze resume with ATS score
- **Interview Prep**: Practice interview questions by role
- **Job Matcher**: Find matching jobs based on skills
- **Profile**: Manage user profile and account settings

## 🎯 Component Architecture

### Components
- **Navbar**: Navigation with authentication state
- **Sidebar**: Dashboard navigation menu
- **Footer**: Application footer
- **ProtectedRoute**: Route guard for authenticated users
- **LoadingSpinner**: Loading state indicator
- **ScoreCard**: Display scores with animations
- **ResumeUploader**: File upload with drag-and-drop
- **InterviewCard**: Interview practice card component

### Layouts
- **MainLayout**: Standard layout with Navbar and Footer
- **DashboardLayout**: Dashboard layout with Navbar and Sidebar

## 🔄 Data Flow

1. **Authentication**: AuthContext manages user state
2. **Protected Routes**: useAuth hook checks authentication status
3. **Services**: API calls through centralized service layer
4. **Components**: Display data and handle user interactions
5. **Notifications**: Toast notifications for feedback

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy
```

## 📝 Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Firebase API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_API_BASE_URL` | API base URL |

## 🔐 Security

- Protected routes for authenticated users
- Firebase security rules in backend
- Secure password validation
- HTTPS recommended for production
- Environment variables for sensitive data

## 📊 Performance

- Code splitting with React Router
- Image optimization
- CSS minification
- JavaScript minification
- Lazy loading of routes

## 🎓 Learning Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🎯 Future Enhancements

- [ ] Video interview practice
- [ ] Resume template library
- [ ] Salary insights
- [ ] LinkedIn integration
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app

## 📞 Support

For support, please open an issue on GitHub or contact support@hiresense.ai

## 🙏 Acknowledgments

- React team for the amazing framework
- Vite for the fast build tool
- Tailwind CSS for utility-first CSS
- Firebase for backend services
- All contributors and users

---

**Made with ❤️ by HireSense AI**

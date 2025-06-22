# PromptFolio
PromptFolio creates a polished portfolio website for students instantly — just enter a prompt about your skills and projects. No coding required!

For students who want to showcase their work quickly and professionally.

How it works:
1. Write a short prompt about yourself.

2. PromptFolio builds your portfolio automatically.

3. We create your site.

4. Change it to how you like

5. Publish Your Site!!

Start building your portfolio in seconds!

# PromptFolio - AI-Powered Portfolio Generator


> Create professional portfolios for students instantly with AI. No coding required!

**Live Demo:** [https://zingy-horse-84b9a9.netlify.app](https://zingy-horse-84b9a9.netlify.app)

## 🚀 Overview

PromptFolio is a modern web application that transforms student information into stunning, professional portfolio websites using AI-powered generation. Students simply fill out structured forms about their skills, projects, and experience, and the application instantly generates a beautiful, responsive portfolio that can be deployed to GitHub Pages with one click.

## ✨ Key Features

- **AI-Powered Generation**: Intelligent parsing and structuring of user input
- **One-Click GitHub Deployment**: Automatic repository creation and GitHub Pages setup
- **Responsive Design**: Mobile-first, production-ready portfolios
- **Real-time Preview**: Instant portfolio generation and preview
- **GitHub Integration**: OAuth authentication and automated deployment
- **Modern UI/UX**: Clean, professional interface with smooth animations
- **Zero Configuration**: No technical knowledge required for end users

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript for type safety and modern development
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for utility-first styling and responsive design
- **Lucide React** for consistent, beautiful icons

### Backend Services
- **Netlify Functions** for serverless backend operations
- **GitHub OAuth API** for secure authentication
- **GitHub REST API** for repository management and deployment

### Deployment & Hosting
- **Netlify** for main application hosting with automatic deployments
- **GitHub Pages** for generated portfolio hosting
- **Custom domain support** through GitHub Pages

## 📁 Project Structure

```
promptfolio/
├── src/
│   ├── components/
│   │   ├── GitHubAuth.tsx          # GitHub OAuth authentication component
│   │   └── GitHubDeployment.tsx    # Deployment workflow management
│   ├── App.tsx                     # Main application component
│   ├── main.tsx                    # Application entry point
│   └── index.css                   # Global styles
├── netlify/
│   └── functions/
│       ├── github-auth.js          # GitHub OAuth token exchange
│       └── github-deploy.js        # Repository creation and deployment
├── public/
│   └── _redirects                  # Netlify routing configuration
├── netlify.toml                    # Netlify build configuration
└── package.json                    # Dependencies and scripts
```

## 🔧 Core Components

### 1. Portfolio Generator (`App.tsx`)
- **State Management**: React hooks for form data, generation status, and user authentication
- **Form Validation**: Client-side validation for required fields
- **AI Processing**: Intelligent parsing of user input into structured portfolio data
- **Multi-step Workflow**: Landing → Generator → Portfolio → Deployment

### 2. GitHub Authentication (`GitHubAuth.tsx`)
- **OAuth 2.0 Flow**: Secure GitHub authentication with proper state validation
- **Scope Management**: Requests minimal required permissions (`public_repo`, `user:email`)
- **Error Handling**: Comprehensive error states and user feedback
- **Security**: CSRF protection with state parameter validation

### 3. GitHub Deployment (`GitHubDeployment.tsx`)
- **Multi-step Process**: Repository creation → File upload → Pages configuration
- **Real-time Status**: Live deployment progress with visual feedback
- **Error Recovery**: Retry mechanisms and detailed error reporting
- **Site Verification**: Automatic checking of deployed site availability

### 4. Serverless Functions

#### GitHub Auth Function (`github-auth.js`)
```javascript
// Handles OAuth token exchange
POST /.netlify/functions/github-auth
{
  "code": "oauth_code_from_github",
  "clientId": "github_client_id",
  "clientSecret": "github_client_secret"
}
```

#### GitHub Deploy Function (`github-deploy.js`)
```javascript
// Handles repository operations
POST /.netlify/functions/github-deploy
{
  "portfolioData": {...},
  "githubUser": {...},
  "githubToken": "access_token",
  "action": "create-repo" | "upload-files" | "enable-pages"
}
```

## 🎨 Design System

### Color Palette
- **Primary**: Black (`#000000`) for main actions and text
- **Secondary**: Gray scale (`#f9fafb` to `#111827`) for backgrounds and subtle elements
- **Accent**: Blue (`#3b82f6`) for links and interactive states
- **Success**: Green (`#10b981`) for completed states
- **Warning**: Yellow (`#f59e0b`) for attention states
- **Error**: Red (`#ef4444`) for error states

### Typography
- **Font Family**: Inter (Google Fonts) for clean, modern readability
- **Scale**: Tailwind's default type scale with custom adjustments
- **Weights**: 300 (light), 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Layout Principles
- **Mobile-first**: Responsive design starting from 320px
- **8px Grid System**: Consistent spacing using Tailwind's spacing scale
- **Progressive Disclosure**: Information revealed progressively to reduce cognitive load
- **Visual Hierarchy**: Clear content hierarchy using typography and spacing

## 🔐 Security Implementation

### GitHub OAuth Security
- **State Parameter**: CSRF protection with random state generation
- **Secure Storage**: Temporary state storage in localStorage with cleanup
- **Token Handling**: Access tokens never stored in frontend, used immediately
- **Scope Limitation**: Minimal required permissions requested

### API Security
- **CORS Configuration**: Proper CORS headers for cross-origin requests
- **Input Validation**: Server-side validation of all user inputs
- **Error Handling**: Secure error messages without sensitive information exposure
- **Rate Limiting**: GitHub API rate limits respected with proper error handling

## 🚀 Deployment Guide

### Prerequisites
- Node.js 18+ and npm
- Netlify account
- GitHub OAuth App configured

### Local Development
```bash
# Clone the repository
git clone https://github.com/yourusername/promptfolio.git
cd promptfolio

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration
Create a GitHub OAuth App with these settings:
- **Application name**: PromptFolio
- **Homepage URL**: `https://your-domain.com`
- **Authorization callback URL**: `https://your-domain.com`

Update the client credentials in:
- `src/App.tsx`
- `netlify/functions/github-auth.js`

### Production Deployment
```bash
# Build for production
npm run build

# Deploy to Netlify (automatic via Git integration)
# Or manual deploy:
netlify deploy --prod --dir=dist
```

## 🔄 API Reference

### Portfolio Data Structure
```typescript
interface PortfolioData {
  name: string;
  title: string;
  email: string;
  bio: string;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    tech: string[];
    link?: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
}
```

### GitHub User Structure
```typescript
interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}
```

## 🛠️ Development Workflow

### Code Quality
- **TypeScript**: Full type safety throughout the application
- **ESLint**: Code linting with React and TypeScript rules
- **Prettier**: Consistent code formatting (recommended)
- **Git Hooks**: Pre-commit hooks for code quality (recommended)

### Testing Strategy (Recommended Enhancements)
```bash
# Add testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom

# Component testing
npm run test

# E2E testing with Playwright
npm install --save-dev @playwright/test
```

### Performance Optimization
- **Code Splitting**: Dynamic imports for large components
- **Image Optimization**: WebP format with fallbacks
- **Bundle Analysis**: Webpack bundle analyzer for optimization
- **Caching**: Proper HTTP caching headers via Netlify

## 🚧 Future Enhancements

### High Priority
1. **Template System**: Multiple portfolio templates and themes
2. **Custom Domains**: Support for custom domain configuration
3. **Analytics Integration**: Google Analytics and visitor tracking
4. **SEO Optimization**: Meta tags, structured data, and sitemap generation
5. **Export Options**: PDF export and other format support

### Medium Priority
1. **User Accounts**: User registration and portfolio management
2. **Collaboration**: Team portfolios and shared projects
3. **Integration APIs**: LinkedIn, Behance, and other platform imports
4. **Advanced Customization**: Color schemes, fonts, and layout options
5. **Performance Metrics**: Site speed and accessibility scoring

### Low Priority
1. **Multi-language Support**: Internationalization (i18n)
2. **Advanced Analytics**: Detailed visitor insights and engagement metrics
3. **A/B Testing**: Template and feature testing capabilities
4. **API Access**: Public API for third-party integrations
5. **White-label Solution**: Branded versions for institutions

## 🐛 Known Issues & Limitations

### Current Limitations
1. **GitHub Pages Delay**: 1-5 minute deployment time (GitHub limitation)
2. **Single Template**: Only one portfolio design currently available
3. **Limited Customization**: No theme or color customization options
4. **No User Persistence**: No user accounts or portfolio saving
5. **GitHub Dependency**: Requires GitHub account for deployment

### Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Not Supported**: Internet Explorer (any version)

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines:

### Getting Started
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes with proper TypeScript types
4. Add tests for new functionality
5. Ensure all tests pass: `npm run test`
6. Commit with conventional commits: `git commit -m 'feat: add amazing feature'`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

### Development Guidelines
- Follow existing code style and patterns
- Add TypeScript types for all new code
- Include tests for new features
- Update documentation for API changes
- Ensure responsive design for UI changes

### Issue Reporting
Please use GitHub Issues with these labels:
- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements or additions to docs
- `good first issue`: Good for newcomers

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Netlify** for seamless deployment and hosting
- **GitHub** for OAuth and Pages hosting
- **Lucide** for beautiful, consistent icons
- **Vite** for lightning-fast development experience



---

**Built with ❤️ for students worldwide**

*Last updated: January 2025*

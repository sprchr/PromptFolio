import React, { useState, useEffect } from 'react';
import { Sparkles, User, Share2, Download, ArrowRight, Github, Linkedin, Mail, ExternalLink, Star, Zap, Target } from 'lucide-react';
import { GitHubAuth } from './components/GitHubAuth';
import { GitHubDeployment } from './components/GitHubDeployment';

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

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

interface FormData {
  name: string;
  email: string;
  title: string;
  bio: string;
  skills: string;
  projects: string;
  experience: string;
}

// Updated GitHub OAuth credentials
const GITHUB_CLIENT_ID = 'Ov23liWcqO97hq90ZEaU';
const GITHUB_CLIENT_SECRET = 'd9ffdc1d72a8d4e99e0e4ff81fb3dce23d6a556d';

function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'generator' | 'portfolio'>('landing');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    title: '',
    bio: '',
    skills: '',
    projects: '',
    experience: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [showGitHubAuth, setShowGitHubAuth] = useState(false);
  const [showDeployment, setShowDeployment] = useState(false);
  const [githubUser, setGitHubUser] = useState<GitHubUser | null>(null);
  const [githubToken, setGitHubToken] = useState<string>('');
  const [isProcessingGitHubAuth, setIsProcessingGitHubAuth] = useState(false);

  // Handle GitHub OAuth callback on app load
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const storedState = localStorage.getItem('github_oauth_state');
    const storedPortfolioData = localStorage.getItem('portfolio_data_for_github');
    
    console.log('App loaded, checking for GitHub OAuth callback...');
    console.log('Code:', code);
    console.log('State:', state);
    console.log('Stored state:', storedState);
    
    if (code && state && state === storedState) {
      console.log('Valid GitHub OAuth callback detected');
      setIsProcessingGitHubAuth(true);
      
      // Clean up URL immediately
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // If we have stored portfolio data, restore it
      if (storedPortfolioData) {
        try {
          const parsedPortfolioData = JSON.parse(storedPortfolioData);
          console.log('Restored portfolio data:', parsedPortfolioData);
          setPortfolioData(parsedPortfolioData);
          setCurrentView('portfolio');
        } catch (error) {
          console.error('Failed to parse stored portfolio data:', error);
        }
      }
      
      // Handle the GitHub auth callback
      handleGitHubAuthCallback(code);
      
      // Clean up stored data
      localStorage.removeItem('github_oauth_state');
      localStorage.removeItem('portfolio_data_for_github');
    } else if (code) {
      console.log('GitHub OAuth callback detected but state mismatch or missing');
      // Clean up URL anyway
      window.history.replaceState({}, document.title, window.location.pathname);
      alert('GitHub authorization failed due to security check. Please try again.');
    }
  }, []);

  const handleGitHubAuthCallback = async (code: string) => {
    try {
      console.log('Processing GitHub auth with code:', code);
      
      // Call our Netlify function to exchange code for token
      const response = await fetch('/.netlify/functions/github-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          clientId: GITHUB_CLIENT_ID,
          clientSecret: GITHUB_CLIENT_SECRET,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not ok:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to authenticate'}`);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error('Non-JSON response:', responseText);
        throw new Error('Server returned non-JSON response');
      }

      const data = await response.json();
      console.log('GitHub auth response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.user || !data.access_token) {
        throw new Error('Invalid response from authentication server');
      }

      console.log('GitHub auth successful:', data.user);
      
      // Set user data and token
      setGitHubUser(data.user);
      setGitHubToken(data.access_token);
      setShowDeployment(true);
      setIsProcessingGitHubAuth(false);
      
    } catch (error) {
      console.error('GitHub auth error:', error);
      setIsProcessingGitHubAuth(false);
      alert(`GitHub authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const generatePortfolio = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert('Please fill in at least your name and email');
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call with realistic delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate portfolio based on form data
    const mockData: PortfolioData = {
      name: formData.name,
      title: formData.title || "Student",
      email: formData.email,
      bio: formData.bio || generateDefaultBio(formData.name, formData.title),
      skills: parseSkills(formData.skills),
      projects: parseProjects(formData.projects),
      experience: parseExperience(formData.experience)
    };
    
    setPortfolioData(mockData);
    setIsGenerating(false);
    setCurrentView('portfolio');
  };

  const generateDefaultBio = (name: string, title: string): string => {
    return `Passionate ${title.toLowerCase()} with a strong foundation in technology and a drive to create innovative solutions. Currently pursuing my degree while building practical experience through hands-on projects and continuous learning.`;
  };

  const parseSkills = (skillsText: string): string[] => {
    if (!skillsText.trim()) {
      return ['JavaScript', 'React', 'Node.js', 'HTML/CSS', 'Git', 'Python'];
    }
    
    return skillsText.split(',').map(skill => skill.trim()).filter(skill => skill.length > 0);
  };

  const parseProjects = (projectsText: string): PortfolioData['projects'] => {
    if (!projectsText.trim()) {
      return [
        {
          title: 'Portfolio Website',
          description: 'Responsive personal portfolio showcasing projects and skills with modern design.',
          tech: ['React', 'TypeScript', 'Tailwind CSS'],
          link: 'https://github.com/example/portfolio'
        },
        {
          title: 'Weather Dashboard',
          description: 'Real-time weather application with location-based forecasts and interactive charts.',
          tech: ['JavaScript', 'Chart.js', 'OpenWeather API'],
          link: 'https://github.com/example/weather-app'
        }
      ];
    }

    // Simple parsing - in a real app, you'd use more sophisticated NLP
    const projects = projectsText.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('-');
      return {
        title: parts[0]?.trim() || 'Project',
        description: parts[1]?.trim() || 'Project description',
        tech: ['JavaScript', 'React'],
        link: 'https://github.com/example/project'
      };
    });

    return projects.length > 0 ? projects : [
      {
        title: 'Personal Project',
        description: projectsText.substring(0, 200),
        tech: ['JavaScript', 'React'],
        link: 'https://github.com/example/project'
      }
    ];
  };

  const parseExperience = (experienceText: string): PortfolioData['experience'] => {
    const defaultExperience = [
      {
        title: 'Student',
        company: 'University',
        duration: '2022 - Present',
        description: 'Currently pursuing my degree with focus on practical application of technology and continuous learning.'
      }
    ];

    if (!experienceText.trim()) {
      return defaultExperience;
    }

    // Simple parsing - in a real app, you'd use more sophisticated NLP
    const experiences = experienceText.split('\n').filter(line => line.trim()).map(line => {
      const parts = line.split('-');
      return {
        title: parts[0]?.trim() || 'Position',
        company: parts[1]?.trim() || 'Company',
        duration: parts[2]?.trim() || '2025',
        description: parts[3]?.trim() || 'Experience description'
      };
    });

    return experiences.length > 0 ? experiences : [
      {
        title: 'Experience',
        company: 'Organization',
        duration: '2025',
        description: experienceText.substring(0, 200)
      }
    ];
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGitHubAuthSuccess = (user: GitHubUser, token: string) => {
    setGitHubUser(user);
    setGitHubToken(token);
    setShowGitHubAuth(false);
    setShowDeployment(true);
  };

  const initiateGitHubAuth = () => {
    if (portfolioData) {
      // Store portfolio data for after OAuth redirect
      localStorage.setItem('portfolio_data_for_github', JSON.stringify(portfolioData));
      console.log('Stored portfolio data for GitHub auth');
    }
    setShowGitHubAuth(true);
  };

  // Show processing screen if we're handling GitHub auth
  if (isProcessingGitHubAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2">Processing GitHub Authorization...</h2>
          <p className="text-gray-400">Setting up your deployment</p>
        </div>
      </div>
    );
  }

  if (currentView === 'landing') {
    return (
      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        {/* Header */}
        <header className="relative z-10 px-6 py-6 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-300 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-semibold tracking-tight">PromptFolio</span>
            </div>
            <button
              onClick={() => setCurrentView('generator')}
              className="px-6 py-2.5 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 font-medium text-sm"
            >
              Get Started
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative z-10 px-6 pt-20 pb-32">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8">
              <Star className="w-4 h-4 text-yellow-400 mr-2" />
              <span className="text-sm text-gray-300">Trusted by 10,000+ students</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-[1.1] tracking-tight">
              Create your
              <br />
              <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                professional portfolio
              </span>
              <br />
              in seconds
            </h1>
            
            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              PromptFolio transforms your story into a stunning portfolio website. 
              Just describe yourself, and watch as AI crafts your professional presence.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => setCurrentView('generator')}
                className="group px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold flex items-center"
              >
                Start Building
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="px-8 py-4 border border-white/20 text-white rounded-lg hover:bg-white/5 transition-all duration-200 font-medium">
                View Example
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-md mx-auto">
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">10k+</div>
                <div className="text-sm text-gray-500">Portfolios Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">30s</div>
                <div className="text-sm text-gray-500">Average Build Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">95%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 px-6 py-24 border-t border-white/10">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">How it works</h2>
              <p className="text-gray-400 text-lg">Three simple steps to your perfect portfolio</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Tell your story</h3>
                <p className="text-gray-400 leading-relaxed">
                  Fill in structured fields about your skills, projects, and experience. 
                  Our AI understands context and creates accordingly.
                </p>
              </div>

              <div className="group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI builds instantly</h3>
                <p className="text-gray-400 leading-relaxed">
                  Advanced algorithms analyze your input and generate a 
                  professional portfolio tailored to your unique profile.
                </p>
              </div>

              <div className="group">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-white/20 transition-colors">
                  <Target className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Deploy & succeed</h3>
                <p className="text-gray-400 leading-relaxed">
                  One-click deployment to GitHub Pages. Share with employers, 
                  professors, or anyone who needs to see your work.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="relative z-10 px-6 py-24 border-t border-white/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Loved by students worldwide</h2>
            <p className="text-gray-400 text-lg mb-12">Join thousands who've landed their dream opportunities</p>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold">Sarah Chen</div>
                    <div className="text-sm text-gray-400">CS Student, MIT</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  "PromptFolio helped me land my dream internship at Google. 
                  The portfolio looked so professional, I couldn't believe I made it in 30 seconds."
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-full mr-3"></div>
                  <div>
                    <div className="font-semibold">Marcus Johnson</div>
                    <div className="text-sm text-gray-400">Design Student, RISD</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">
                  "I was struggling to showcase my work effectively. PromptFolio 
                  created a stunning portfolio that perfectly represents my style and skills."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative z-10 px-6 py-24 border-t border-white/10">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Ready to stand out?
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Create your professional portfolio in seconds, not hours.
            </p>
            <button
              onClick={() => setCurrentView('generator')}
              className="group px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 font-semibold text-lg flex items-center mx-auto"
            >
              Start Building Now
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 px-6 py-12 border-t border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gradient-to-br from-white to-gray-300 rounded flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-black" />
              </div>
              <span className="font-semibold">PromptFolio</span>
            </div>
            <div className="text-sm text-gray-500">
              © 2025 PromptFolio. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    );
  }

  if (currentView === 'generator') {
    return (
      <div className="min-h-screen bg-black text-white">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px]"></div>
        
        <header className="relative z-10 px-6 py-6 border-b border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setCurrentView('landing')}
              className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-white to-gray-300 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-semibold tracking-tight">PromptFolio</span>
            </button>
          </div>
        </header>

        <div className="relative z-10 px-6 py-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Build your portfolio
              </h1>
              <p className="text-xl text-gray-400">
                Fill in the details below to create your professional portfolio
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* Name Field */}
                <div>
                  <label className="block text-lg font-semibold mb-3">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Sarah Chen"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all"
                  />
                  <p className="text-sm text-gray-400 mt-2">Your full name as you want it to appear</p>
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-lg font-semibold mb-3">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="e.g., sarah.chen@mit.edu"
                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all"
                  />
                  <p className="text-sm text-gray-400 mt-2">Professional email for contact</p>
                </div>
              </div>

              {/* Title Field */}
              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3">
                  Professional Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Computer Science Student, Web Developer, Data Science Student"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all"
                />
                <p className="text-sm text-gray-400 mt-2">Your current role or field of study</p>
              </div>

              {/* Bio Field */}
              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3">
                  About You
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="e.g., Passionate computer science student with a strong foundation in web development. Currently pursuing my degree at MIT while building practical experience through internships and personal projects. I love creating innovative solutions and am always eager to learn new technologies."
                  className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/20 resize-none text-white placeholder-gray-500 transition-all"
                />
                <p className="text-sm text-gray-400 mt-2">Brief description of yourself, your interests, and goals</p>
              </div>

              {/* Skills Field */}
              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3">
                  Skills & Technologies
                </label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => handleInputChange('skills', e.target.value)}
                  placeholder="e.g., JavaScript, React, Python, Node.js, HTML/CSS, Git, MongoDB, Machine Learning"
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/20 text-white placeholder-gray-500 transition-all"
                />
                <p className="text-sm text-gray-400 mt-2">Comma-separated list of your technical skills</p>
              </div>

              {/* Projects Field */}
              <div className="mb-6">
                <label className="block text-lg font-semibold mb-3">
                  Projects
                </label>
                <textarea
                  value={formData.projects}
                  onChange={(e) => handleInputChange('projects', e.target.value)}
                  placeholder="e.g., E-commerce Platform - Full-stack web application with user authentication and payment integration
Weather Dashboard - Real-time weather app with interactive charts
Task Manager App - Mobile-first productivity application"
                  className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/20 resize-none text-white placeholder-gray-500 transition-all"
                />
                <p className="text-sm text-gray-400 mt-2">List your projects (one per line: Title - Description)</p>
              </div>

              {/* Experience Field */}
              <div className="mb-8">
                <label className="block text-lg font-semibold mb-3">
                  Experience & Education
                </label>
                <textarea
                  value={formData.experience}
                  onChange={(e) => handleInputChange('experience', e.target.value)}
                  placeholder="e.g., Software Development Intern - TechCorp Solutions - Jun 2024 - Aug 2024 - Collaborated with senior developers on web applications
Bachelor of Computer Science - MIT - 2022 - 2026 - Relevant coursework in algorithms and software engineering"
                  className="w-full h-32 p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-white/20 focus:border-white/20 resize-none text-white placeholder-gray-500 transition-all"
                />
                <p className="text-sm text-gray-400 mt-2">List your work experience and education (one per line: Title - Company - Duration - Description)</p>
              </div>

              <div className="mb-8 p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium mb-1">Pro tip</div>
                    <div className="text-sm text-gray-400">
                      Fill in as much detail as possible for the best results. You can always edit your portfolio later.
                      Required fields are marked with an asterisk (*).
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={generatePortfolio}
                disabled={!formData.name.trim() || !formData.email.trim() || isGenerating}
                className="w-full py-4 bg-white text-black rounded-xl hover:bg-gray-100 transition-all duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black mr-3"></div>
                    Generating your portfolio...
                  </>
                ) : (
                  <>
                    Generate my portfolio
                    <Sparkles className="ml-2 w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'portfolio' && portfolioData) {
    return (
      <div className="min-h-screen bg-white">
        {/* Portfolio Header with Actions */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-10 backdrop-blur-sm bg-white/95">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <button
              onClick={() => setCurrentView('generator')}
              className="text-gray-600 hover:text-gray-900 font-medium flex items-center"
            >
              ← Edit portfolio
            </button>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
              <button 
                onClick={initiateGitHubAuth}
                className="flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"
              >
                <Github className="w-4 h-4 mr-2" />
                Deploy to GitHub
              </button>
              <button className="flex items-center px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* Portfolio Content */}
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero Section */}
          <section className="text-center mb-20">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">
                {portfolioData.name.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              {portfolioData.name}
            </h1>
            <p className="text-2xl text-gray-600 font-medium mb-8">
              {portfolioData.title}
            </p>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
              {portfolioData.bio}
            </p>
            <div className="flex items-center justify-center space-x-4">
              <a href={`mailto:${portfolioData.email}`} className="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all">
                <Mail className="w-5 h-5 mr-2" />
                Get in touch
              </a>
              <a href="#" className="flex items-center px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </a>
              <a href="#" className="flex items-center px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                <Linkedin className="w-5 h-5 mr-2" />
                LinkedIn
              </a>
            </div>
          </section>

          {/* Skills Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Skills & Technologies</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {portfolioData.skills.map((skill, index) => (
                <div key={index} className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-center hover:bg-gray-100 transition-colors">
                  <span className="font-semibold text-gray-800">{skill}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Projects Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Featured Projects</h2>
            <div className="space-y-8">
              {portfolioData.projects.map((project, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">{project.title}</h3>
                    {project.link && (
                      <a href={project.link} className="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  <p className="text-gray-600 mb-6 leading-relaxed text-lg">{project.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.tech.map((tech, techIndex) => (
                      <span key={techIndex} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Experience Section */}
          <section className="mb-20">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Experience & Education</h2>
            <div className="space-y-8">
              {portfolioData.experience.map((exp, index) => (
                <div key={index} className="bg-white border border-gray-100 rounded-2xl p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{exp.title}</h3>
                      <p className="text-lg text-gray-600 font-medium">{exp.company}</p>
                    </div>
                    <span className="text-gray-500 font-medium mt-2 md:mt-0">{exp.duration}</span>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Contact Section */}
          <section className="bg-black rounded-2xl p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Let's work together</h2>
            <p className="text-lg mb-8 text-gray-300">
              I'm always open to discussing new opportunities and interesting projects.
            </p>
            <a
              href={`mailto:${portfolioData.email}`}
              className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-all font-semibold text-lg"
            >
              <Mail className="w-5 h-5 mr-2" />
              Send me an email
            </a>
          </section>
        </div>

        {/* GitHub Auth Modal */}
        {showGitHubAuth && (
          <GitHubAuth
            onAuthSuccess={handleGitHubAuthSuccess}
            onClose={() => setShowGitHubAuth(false)}
          />
        )}

        {/* GitHub Deployment Modal */}
        {showDeployment && portfolioData && githubUser && (
          <GitHubDeployment
            portfolioData={portfolioData}
            githubUser={githubUser}
            githubToken={githubToken}
            onClose={() => setShowDeployment(false)}
          />
        )}
      </div>
    );
  }

  return null;
}

export default App;
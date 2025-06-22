import React, { useState } from 'react';
import { Github, CheckCircle, AlertCircle, Loader, ExternalLink, Info, Settings } from 'lucide-react';

interface GitHubUser {
  login: string;
  name: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubAuthProps {
  onAuthSuccess: (user: GitHubUser, token: string) => void;
  onClose: () => void;
}

// Updated GitHub OAuth credentials
const GITHUB_CLIENT_ID = 'BLANK_CLIENT_ID'; // Replace with your actual GitHub OAuth client ID

export const GitHubAuth: React.FC<GitHubAuthProps> = ({ onAuthSuccess, onClose }) => {
  const [authStatus, setAuthStatus] = useState<'idle' | 'authorizing'>('idle');

  const initiateGitHubAuth = () => {
    const scope = 'public_repo,user:email';
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    localStorage.setItem('github_oauth_state', state);
    
    const redirectUri = window.location.origin;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&allow_signup=true`;
    
    console.log('Initiating GitHub auth with URL:', githubAuthUrl);
    
    setAuthStatus('authorizing');
    
    // Redirect to GitHub authorization
    window.location.href = githubAuthUrl;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Connect to GitHub</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {authStatus === 'idle' && (
          <>
            <div className="text-center mb-6">
              <Github className="w-16 h-16 mx-auto mb-4 text-gray-700" />
              <p className="text-gray-600 mb-4">
                Connect your GitHub account to automatically create and deploy your portfolio repository.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-4">
                <h3 className="font-semibold text-blue-900 mb-2">What we'll do:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Create a new repository for your portfolio</li>
                  <li>• Upload your portfolio files automatically</li>
                  <li>• Enable GitHub Pages hosting</li>
                  <li>• Provide you with a live URL</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left mb-4">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Ready to Deploy:</h3>
                    <p className="text-sm text-green-800">
                      GitHub OAuth is pre-configured. Just click below to connect your account!
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={initiateGitHubAuth}
              className="w-full flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
            >
              <Github className="w-5 h-5 mr-2" />
              Connect GitHub Account
            </button>
          </>
        )}

        {authStatus === 'authorizing' && (
          <div className="text-center py-8">
            <Loader className="w-12 h-12 animate-spin mx-auto mb-4 text-black" />
            <h3 className="text-xl font-semibold mb-2">Redirecting to GitHub...</h3>
            <p className="text-gray-600 mb-4">You should be redirected to GitHub's authorization page</p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left">
              <p className="text-sm text-gray-600">
                <strong>If the redirect doesn't work:</strong>
              </p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• Check if popup blockers are enabled</li>
                <li>• Try refreshing the page and clicking again</li>
                <li>• Make sure JavaScript is enabled</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
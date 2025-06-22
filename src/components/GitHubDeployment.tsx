import React, { useState, useEffect } from 'react';
import { Github, ExternalLink, CheckCircle, AlertCircle, Loader, Globe, FileText, Settings, Clock, RefreshCw } from 'lucide-react';

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

interface GitHubDeploymentProps {
  portfolioData: PortfolioData;
  githubUser: GitHubUser;
  githubToken: string;
  onClose: () => void;
}

export const GitHubDeployment: React.FC<GitHubDeploymentProps> = ({ 
  portfolioData, 
  githubUser, 
  githubToken, 
  onClose 
}) => {
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'creating' | 'uploading' | 'configuring' | 'waiting' | 'checking' | 'success' | 'error'>('idle');
  const [deploymentUrl, setDeploymentUrl] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [waitingTime, setWaitingTime] = useState(0);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [siteStatus, setSiteStatus] = useState<'pending' | 'ready' | 'failed'>('pending');

  const deploymentSteps = [
    { icon: Github, label: 'Creating repository', description: 'Setting up your portfolio repository' },
    { icon: FileText, label: 'Uploading files', description: 'Generating and uploading portfolio HTML' },
    { icon: Settings, label: 'Configuring Pages', description: 'Enabling GitHub Pages hosting' },
    { icon: Clock, label: 'Waiting for deployment', description: 'GitHub Pages is building your site' },
    { icon: Globe, label: 'Site is live', description: 'Your portfolio is now accessible' }
  ];

  // Timer effect for waiting period
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (deploymentStatus === 'waiting') {
      interval = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [deploymentStatus]);

  // Auto-check site status after initial waiting period
  useEffect(() => {
    if (deploymentStatus === 'waiting' && waitingTime >= 60) { // Start checking after 1 minute
      checkSiteStatus();
    }
  }, [waitingTime, deploymentStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const checkSiteStatus = async () => {
    if (!deploymentUrl || isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    
    try {
      // Use a simple fetch with no-cors mode to check if site responds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(deploymentUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // In no-cors mode, we can't read the response, but if it doesn't throw, the site is likely up
      setSiteStatus('ready');
      setCurrentStep(4);
      setDeploymentStatus('success');
      
    } catch (error) {
      // Site might still be building, continue waiting
      setSiteStatus('pending');
      
      // If we've been waiting too long (5+ minutes), suggest manual check
      if (waitingTime >= 300) {
        setSiteStatus('failed');
      }
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const createGitHubRepository = async () => {
    setDeploymentStatus('creating');
    setErrorMessage('');
    setCurrentStep(0);
    setWaitingTime(0);

    try {
      // Step 1: Create repository
      console.log('Creating repository...');
      const createResponse = await fetch('/.netlify/functions/github-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioData,
          githubUser,
          githubToken,
          action: 'create-repo',
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Failed to create repository');
      }

      const createData = await createResponse.json();
      setRepositoryUrl(`https://github.com/${githubUser.login}/${createData.repoName}`);
      
      setCurrentStep(1);
      setDeploymentStatus('uploading');

      // Step 2: Upload portfolio files
      console.log('Uploading portfolio files...');
      const uploadResponse = await fetch('/.netlify/functions/github-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioData,
          githubUser,
          githubToken,
          action: 'upload-files',
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload files');
      }

      setCurrentStep(2);
      setDeploymentStatus('configuring');

      // Step 3: Enable GitHub Pages
      console.log('Configuring GitHub Pages...');
      const pagesResponse = await fetch('/.netlify/functions/github-deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          portfolioData,
          githubUser,
          githubToken,
          action: 'enable-pages',
        }),
      });

      if (!pagesResponse.ok) {
        const errorData = await pagesResponse.json();
        throw new Error(errorData.error || 'Failed to configure GitHub Pages');
      }

      const pagesData = await pagesResponse.json();
      setCurrentStep(3);
      setDeploymentUrl(pagesData.deployUrl);
      setRepositoryUrl(pagesData.repositoryUrl);
      
      // Start waiting period for GitHub Pages to build
      setDeploymentStatus('waiting');
      setSiteStatus('pending');
      
    } catch (error) {
      console.error('Deployment error:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create repository and deploy portfolio');
      setDeploymentStatus('error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Deploy Portfolio</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* GitHub User Info */}
        <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <img src={githubUser.avatar_url} alt={githubUser.name} className="w-10 h-10 rounded-full" />
          <div>
            <div className="font-semibold text-gray-900">{githubUser.name}</div>
            <div className="text-sm text-gray-600">@{githubUser.login}</div>
          </div>
        </div>

        {deploymentStatus === 'idle' && (
          <>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Ready to deploy your portfolio to GitHub Pages! Your site will be available at:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 font-mono text-sm">
                https://<span className="text-blue-600">{githubUser.login}</span>.github.io/<span className="text-green-600">{portfolioData.name.toLowerCase().replace(/\s+/g, '-')}-portfolio</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Deployment Process:</h3>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Create repository: <code className="bg-blue-100 px-1 rounded">{portfolioData.name.toLowerCase().replace(/\s+/g, '-')}-portfolio</code></li>
                <li>2. Generate and upload your portfolio HTML</li>
                <li>3. Configure GitHub Pages for automatic hosting</li>
                <li>4. Wait for GitHub Pages to build and deploy (1-5 minutes)</li>
                <li>5. Your portfolio will be live and accessible!</li>
              </ol>
            </div>

            <button
              onClick={createGitHubRepository}
              className="w-full flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
            >
              <Github className="w-5 h-5 mr-2" />
              Create Repository & Deploy
            </button>
          </>
        )}

        {(deploymentStatus === 'creating' || deploymentStatus === 'uploading' || deploymentStatus === 'configuring' || deploymentStatus === 'waiting' || deploymentStatus === 'checking') && (
          <div className="text-center py-8">
            {deploymentStatus !== 'waiting' && deploymentStatus !== 'checking' && (
              <Loader className="w-12 h-12 animate-spin mx-auto mb-6 text-black" />
            )}
            
            {deploymentStatus === 'waiting' && (
              <div className="mb-6">
                <Clock className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                <div className="text-3xl font-bold text-blue-600 mb-2">{formatTime(waitingTime)}</div>
                <p className="text-gray-600">GitHub Pages is building your site...</p>
              </div>
            )}

            {deploymentStatus === 'checking' && (
              <div className="mb-6">
                <RefreshCw className="w-12 h-12 animate-spin mx-auto mb-4 text-green-500" />
                <p className="text-gray-600">Checking if your site is ready...</p>
              </div>
            )}
            
            <h3 className="text-xl font-semibold mb-4">
              {deploymentStatus === 'waiting' ? 'Waiting for GitHub Pages...' : 
               deploymentStatus === 'checking' ? 'Checking site status...' :
               'Deploying your portfolio...'}
            </h3>
            
            <div className="space-y-4">
              {deploymentSteps.map((step, index) => {
                const StepIcon = step.icon;
                const isCompleted = index < currentStep;
                const isCurrent = index === currentStep;
                
                return (
                  <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg ${
                    isCompleted ? 'bg-green-50 border border-green-200' :
                    isCurrent ? 'bg-blue-50 border border-blue-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <StepIcon className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-medium ${
                        isCompleted ? 'text-green-900' :
                        isCurrent ? 'text-blue-900' :
                        'text-gray-600'
                      }`}>
                        {step.label}
                      </div>
                      <div className={`text-sm ${
                        isCompleted ? 'text-green-700' :
                        isCurrent ? 'text-blue-700' :
                        'text-gray-500'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                    {isCurrent && index < 3 && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    )}
                  </div>
                );
              })}
            </div>

            {deploymentStatus === 'waiting' && (
              <div className="mt-6 space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
                  <h3 className="font-semibold text-yellow-900 mb-2">Please wait - GitHub Pages is building</h3>
                  <p className="text-sm text-yellow-800 mb-2">
                    GitHub Pages typically takes 1-5 minutes to build and deploy your site. This is normal!
                  </p>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Your repository has been created successfully</li>
                    <li>• Files have been uploaded</li>
                    <li>• GitHub Pages is now building your site</li>
                    <li>• We'll automatically check when it's ready</li>
                  </ul>
                </div>

                {waitingTime >= 60 && (
                  <button
                    onClick={checkSiteStatus}
                    disabled={isCheckingStatus}
                    className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-medium disabled:opacity-50"
                  >
                    {isCheckingStatus ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin mr-2" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Check if site is ready
                      </>
                    )}
                  </button>
                )}

                {siteStatus === 'failed' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-left">
                    <h3 className="font-semibold text-orange-900 mb-2">Taking longer than expected</h3>
                    <p className="text-sm text-orange-800 mb-2">
                      Your site might still be building. You can:
                    </p>
                    <ul className="text-sm text-orange-800 space-y-1">
                      <li>• Wait a few more minutes and try the link</li>
                      <li>• Check your repository's Actions tab for build status</li>
                      <li>• Visit the repository settings to verify Pages configuration</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {deploymentStatus === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Portfolio Deployed Successfully!</h3>
            <p className="text-gray-600 mb-6">
              Your portfolio is now live and ready to share with the world
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-600 mb-1">Live Portfolio</p>
                    <p className="font-mono text-sm break-all">{deploymentUrl}</p>
                  </div>
                  <a
                    href={deploymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all text-sm ml-2"
                  >
                    <Globe className="w-4 h-4 mr-1" />
                    Visit
                  </a>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 text-left">
                    <p className="text-sm text-gray-600 mb-1">Repository</p>
                    <p className="font-mono text-sm break-all">{repositoryUrl}</p>
                  </div>
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all text-sm ml-2"
                  >
                    <Github className="w-4 h-4 mr-1" />
                    View
                  </a>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-green-900 mb-2">🎉 Deployment completed in {formatTime(waitingTime)}</h3>
              <h4 className="font-semibold text-green-900 mb-2">Next Steps:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Share your portfolio URL with employers and colleagues</li>
                <li>• Update your LinkedIn and resume with the portfolio link</li>
                <li>• Customize the repository further if needed</li>
                <li>• Keep your portfolio updated with new projects</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
            >
              Done
            </button>
          </div>
        )}

        {deploymentStatus === 'error' && (
          <div className="text-center py-8">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Deployment Failed</h3>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold text-red-900 mb-2">Common Issues:</h3>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• Repository name already exists</li>
                <li>• Insufficient GitHub permissions (need 'public_repo' scope)</li>
                <li>• Invalid or expired access token</li>
                <li>• GitHub API rate limits</li>
              </ul>
            </div>
            <button
              onClick={() => setDeploymentStatus('idle')}
              className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all font-semibold"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
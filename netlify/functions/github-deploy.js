const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { 
      statusCode: 200, 
      headers,
      body: JSON.stringify({ message: 'CORS preflight' })
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    console.log('GitHub deploy function called');
    
    const { portfolioData, githubUser, githubToken, action } = JSON.parse(event.body || '{}');

    if (!portfolioData || !githubUser || !githubToken) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required parameters' }),
      };
    }

    const repoName = `${portfolioData.name.toLowerCase().replace(/\s+/g, '-')}-portfolio`;

    if (action === 'create-repo') {
      // Create repository
      console.log('Creating repository...');
      const createRepoResponse = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'PromptFolio-App',
        },
        body: JSON.stringify({
          name: repoName,
          description: `Portfolio website for ${portfolioData.name}`,
          private: false,
          auto_init: true,
        }),
      });

      if (!createRepoResponse.ok) {
        const errorData = await createRepoResponse.json();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: errorData.message || 'Failed to create repository' }),
        };
      }

      const repoData = await createRepoResponse.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          repository: repoData,
          repoName: repoName,
        }),
      };
    }

    if (action === 'upload-files') {
      // Generate portfolio HTML
      const portfolioHTML = generatePortfolioHTML(portfolioData, githubUser);
      
      console.log('Uploading portfolio files...');
      const uploadResponse = await fetch(`https://api.github.com/repos/${githubUser.login}/${repoName}/contents/index.html`, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'PromptFolio-App',
        },
        body: JSON.stringify({
          message: 'Add portfolio website',
          content: Buffer.from(portfolioHTML).toString('base64'),
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: errorData.message || 'Failed to upload files' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true }),
      };
    }

    if (action === 'enable-pages') {
      // Enable GitHub Pages
      console.log('Configuring GitHub Pages...');
      const pagesResponse = await fetch(`https://api.github.com/repos/${githubUser.login}/${repoName}/pages`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'PromptFolio-App',
        },
        body: JSON.stringify({
          source: {
            branch: 'main',
            path: '/',
          },
        }),
      });

      // GitHub Pages might already be enabled, so we'll continue even if this fails
      const deployUrl = `https://${githubUser.login}.github.io/${repoName}`;
      const repositoryUrl = `https://github.com/${githubUser.login}/${repoName}`;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          deployUrl: deployUrl,
          repositoryUrl: repositoryUrl,
        }),
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid action' }),
    };

  } catch (error) {
    console.error('GitHub deploy error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
    };
  }
};

function generatePortfolioHTML(data, githubUser) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${data.name} - Portfolio</title>
    <meta name="description" content="${data.title} - ${data.bio.substring(0, 150)}...">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    </style>
</head>
<body class="bg-white text-gray-900">
    <!-- Hero Section -->
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white px-6">
        <div class="max-w-4xl mx-auto text-center">
            <div class="w-32 h-32 bg-gradient-to-br from-gray-900 to-gray-700 rounded-2xl mx-auto mb-8 flex items-center justify-center shadow-lg">
                <span class="text-3xl font-bold text-white">
                    ${data.name.split(' ').map(n => n[0]).join('')}
                </span>
            </div>
            <h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
                ${data.name}
            </h1>
            <p class="text-2xl text-gray-600 font-medium mb-8">
                ${data.title}
            </p>
            <p class="text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
                ${data.bio}
            </p>
            <div class="flex items-center justify-center space-x-4 flex-wrap gap-4">
                <a href="mailto:${data.email}" class="flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-all">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Get in touch
                </a>
                <a href="https://github.com/${githubUser.login}" class="flex items-center px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub
                </a>
                <a href="#" class="flex items-center px-6 py-3 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-all">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                </a>
            </div>
        </div>
    </section>

    <!-- Skills Section -->
    <section class="py-20 px-6 bg-gray-50">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Skills & Technologies</h2>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                ${data.skills.map(skill => `
                    <div class="bg-white border border-gray-100 p-4 rounded-xl text-center hover:shadow-md transition-all">
                        <span class="font-semibold text-gray-800">${skill}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Projects Section -->
    <section class="py-20 px-6">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Projects</h2>
            <div class="space-y-8">
                ${data.projects.map(project => `
                    <div class="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg transition-all">
                        <div class="flex items-start justify-between mb-4">
                            <h3 class="text-2xl font-bold text-gray-900">${project.title}</h3>
                            ${project.link ? `
                                <a href="${project.link}" class="flex items-center text-gray-600 hover:text-gray-900 transition-colors">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                                    </svg>
                                </a>
                            ` : ''}
                        </div>
                        <p class="text-gray-600 mb-6 leading-relaxed text-lg">${project.description}</p>
                        <div class="flex flex-wrap gap-2">
                            ${project.tech.map(tech => `
                                <span class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">${tech}</span>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Experience Section -->
    <section class="py-20 px-6 bg-gray-50">
        <div class="max-w-4xl mx-auto">
            <h2 class="text-3xl font-bold text-gray-900 mb-8 text-center">Experience & Education</h2>
            <div class="space-y-8">
                ${data.experience.map(exp => `
                    <div class="bg-white border border-gray-100 rounded-2xl p-8">
                        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                            <div>
                                <h3 class="text-xl font-bold text-gray-900">${exp.title}</h3>
                                <p class="text-lg text-gray-600 font-medium">${exp.company}</p>
                            </div>
                            <span class="text-gray-500 font-medium mt-2 md:mt-0">${exp.duration}</span>
                        </div>
                        <p class="text-gray-600 leading-relaxed">${exp.description}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    </section>

    <!-- Contact Section -->
    <section class="py-20 px-6">
        <div class="max-w-3xl mx-auto">
            <div class="bg-black rounded-2xl p-12 text-center text-white">
                <h2 class="text-3xl font-bold mb-4">Let's work together</h2>
                <p class="text-lg mb-8 text-gray-300">
                    I'm always open to discussing new opportunities and interesting projects.
                </p>
                <a href="mailto:${data.email}" class="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg hover:bg-gray-100 transition-all font-semibold text-lg">
                    <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                    Send me an email
                </a>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="py-12 px-6 border-t border-gray-100">
        <div class="max-w-4xl mx-auto text-center">
            <p class="text-gray-500">© 2025 ${data.name}. Built with PromptFolio.</p>
        </div>
    </footer>
</body>
</html>`;
}
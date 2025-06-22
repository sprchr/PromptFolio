const fetch = require('node-fetch');

// Updated GitHub OAuth credentials
const GITHUB_CLIENT_ID = 'Ov23liWcqO97hq90ZEaU';
const GITHUB_CLIENT_SECRET = 'd9ffdc1d72a8d4e99e0e4ff81fb3dce23d6a556d';

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    console.log('GitHub auth function called');
    console.log('Event body:', event.body);

    const { code } = JSON.parse(event.body || '{}');

    if (!code) {
      console.log('Missing authorization code');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing authorization code' }),
      };
    }

    console.log('Exchanging code for token...');

    // Exchange code for access token using updated credentials
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'PromptFolio-App',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    console.log('Token response status:', tokenResponse.status);

    if (!tokenResponse.ok) {
      console.log('Token response not ok:', tokenResponse.statusText);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Failed to exchange code for token' }),
      };
    }

    const tokenData = await tokenResponse.json();
    console.log('Token data received:', tokenData);

    if (tokenData.error) {
      console.log('Token error:', tokenData.error);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: tokenData.error_description || tokenData.error }),
      };
    }

    if (!tokenData.access_token) {
      console.log('No access token in response');
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No access token received' }),
      };
    }

    console.log('Getting user information...');

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `token ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'PromptFolio-App',
      },
    });

    console.log('User response status:', userResponse.status);

    if (!userResponse.ok) {
      console.log('User response not ok:', userResponse.statusText);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Failed to fetch user data' }),
      };
    }

    const userData = await userResponse.json();
    console.log('User data received:', userData.login);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        access_token: tokenData.access_token,
        user: {
          login: userData.login,
          name: userData.name || userData.login,
          avatar_url: userData.avatar_url,
          html_url: userData.html_url,
        },
      }),
    };
  } catch (error) {
    console.error('GitHub auth error:', error);
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
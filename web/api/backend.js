// api/backend.js
// Vercel Serverless Function for Parcel React App

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    res.status(200).end();
    return;
  }

  const { method, body, headers } = req;
  
  // For Vercel serverless functions, we need to parse the URL differently
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Extract the path after '/api/backend'
  // Example: /api/backend/auth/login → /auth/login
  const path = pathname.replace('/api/backend', '') || '/';
  
  // Your EC2 backend URL
  const backendUrl = `http://13.203.197.179${path}`;
  
  console.log(`Proxying ${method} ${pathname} → ${backendUrl}`);
  
  try {
    // Prepare the request to your backend
    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        // Forward important headers
        ...(headers.authorization && { 'Authorization': headers.authorization }),
        ...(headers['x-api-key'] && { 'X-API-Key': headers['x-api-key'] }),
      },
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    // Make the request to your EC2 backend
    const response = await fetch(backendUrl, fetchOptions);
    
    // Get the response data
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    
    // Return the response from your backend
    res.status(response.status);
    
    if (typeof data === 'object') {
      res.json(data);
    } else {
      res.send(data);
    }
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    // Set CORS headers for error responses too
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    
    // Handle different types of errors
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({ 
        error: 'Backend service unavailable',
        message: 'Could not connect to backend server'
      });
    } else if (error.name === 'AbortError') {
      res.status(408).json({ 
        error: 'Request timeout',
        message: 'Backend request timed out'
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: 'Proxy request failed',
        details: error.message
      });
    }
  }
}
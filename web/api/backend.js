export default async function handler(req, res) {
  const { method, body, url, headers } = req;
  
  // Extract the path after '/api/backend'
  // Example: /api/backend/users/123 → /users/123
  const path = url.replace('/api/backend', '') || '/';
  
  // Your EC2 backend URL (HTTP is fine for server-to-server)
  const backendUrl = `http://13.203.197.179${path}`;
  
  console.log(`Proxying ${method} ${url} → ${backendUrl}`);
  
  try {
    // Prepare the request to your backend
    const fetchOptions = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        // Forward important headers
        ...(headers.authorization && { 'Authorization': headers.authorization }),
        ...(headers['x-api-key'] && { 'X-API-Key': headers['x-api-key'] }),
        // Add any other headers your backend needs
      },
    };

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      fetchOptions.body = JSON.stringify(body);
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
    
    // Set CORS headers for the frontend
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
    
    // Handle preflight requests
    if (method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Return the response from your backend
    res.status(response.status).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    
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
        message: 'Proxy request failed'
      });
    }
  }
}
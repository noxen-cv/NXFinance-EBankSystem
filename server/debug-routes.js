// Debug script for server.js to monitor all incoming requests
// This will help debug route issues, especially 405 Method Not Allowed errors

// Add this code at the beginning of your server.js file, right after middleware declarations
// but before any route handlers

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log('Request headers:', JSON.stringify(req.headers));
    console.log('Request body:', req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : '(no body)');
    
    // Keep track of the original methods
    const origEnd = res.end;
    const origJson = res.json;
    const origSend = res.send;
    
    // Override end
    res.end = function(chunk, encoding) {
        console.log(`[${new Date().toISOString()}] Response ${res.statusCode} to ${req.method} ${req.originalUrl}`);
        return origEnd.apply(this, arguments);
    };
    
    // Override json
    res.json = function(body) {
        console.log(`[${new Date().toISOString()}] JSON Response ${res.statusCode} to ${req.method} ${req.originalUrl}:`);
        console.log('Response body:', body ? JSON.stringify(body) : '(empty)');
        return origJson.apply(this, arguments);
    };
    
    // Override send
    res.send = function(body) {
        console.log(`[${new Date().toISOString()}] Send Response ${res.statusCode} to ${req.method} ${req.originalUrl}:`);
        console.log('Response body:', typeof body === 'string' ? body : '(non-string content)');
        return origSend.apply(this, arguments);
    };
    
    next();
});

// Add this special route to debug 405 errors before the standard API routes
app.all('/api/*', (req, res, next) => {
    const originalUrl = req.originalUrl;
    // Store the route pattern in the request object so we can check later
    req._routePattern = originalUrl;
    next();
});

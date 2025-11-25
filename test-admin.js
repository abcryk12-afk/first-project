// Simple test script to check admin routes
const http = require('http');

// Test admin login
const testData = JSON.stringify({
  email: 'admin@novastake.com',
  password: 'Admin@123456'
});

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': testData.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`Response: ${data}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(testData);
req.end();

console.log('Testing admin login...');

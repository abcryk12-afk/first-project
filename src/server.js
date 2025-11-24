require('dotenv').config();
const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`NovaStake backend running on http://localhost:${PORT}`);
  console.log(' Server started successfully');
});
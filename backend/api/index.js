// api/index.js
const app = require('../index'); // your main express app
const serverless = require('serverless-http');

module.exports = serverless(app);

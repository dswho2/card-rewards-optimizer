// api/index.js
const serverless = require('serverless-http');
const app = require('../index'); // your main express app

module.exports = serverless(app);

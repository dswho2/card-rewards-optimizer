require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const recommendRoute = require('./routes/recommend');
const userRoute = require('./routes/user');

const app = express();

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.path}`);
  next();
});

// CORS setup
const allowedOrigins = [
  'http://localhost:3000',
  'https://card-optimizer.vercel.app',
  process.env.FRONTEND_ORIGIN, // in case this is defined
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Enable preflight requests for all routes
app.options('*', cors());

// JSON parsing
app.use(bodyParser.json());

// Routes
app.use('/api/recommend-card', recommendRoute);
app.use('/api/user-cards', userRoute);

// Root ping
app.get('/', (req, res) => {
  console.log('Received GET /');
  res.send('Backend running');
});

// Export serverless handler
module.exports = app;
// Uncomment for local testing:
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');

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
  process.env.FRONTEND_ORIGIN, // 'https://card-optimizer.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.options(
  '*',
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
  (req, res) => res.sendStatus(204)
);

// JSON parsing
app.use(express.json());

// Routes
app.use('/recommend-card', recommendRoute);
app.use('/user-cards', userRoute);

// Root ping
app.get('/', (req, res) => {
  console.log('Received GET /');
  res.send('Backend running');
});

// Export serverless handler
module.exports = app;

// Uncomment for local testing:
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });
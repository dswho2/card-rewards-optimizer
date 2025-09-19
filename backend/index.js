// index.js - Updated for complete deployment fix
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const recommendRoute = require('./routes/recommend');
const userRoute = require('./routes/user');

const signupRoute = require('./routes/signup');
const loginRoute = require('./routes/login');

const cardsRoute = require('./routes/cards');

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
  process.env.FRONTEND_ORIGIN,
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
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
  (req, res) => res.sendStatus(204)
);

// JSON parsing
app.use(express.json());

// Routes
app.use('/api/recommend-card', recommendRoute);
app.use('/api/user-cards', userRoute);
app.use('/api/signup', signupRoute);
app.use('/api/login', loginRoute);
app.use('/api/cards', cardsRoute);

// Root ping
// app.get('/', (req, res) => {
//   res.send('Backend running');
// });
app.get('/', (req, res) => {
  console.log('Received GET /');
  res.status(200).json({ ok: true });
});

// Export serverless handler
module.exports = app;

// Uncomment for local testing:
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
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
  process.env.FRONTEND_ORIGIN, // 'https://card-optimizer.vercel.app'
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
}));

app.options(
  '*',
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  }),
  (req, res) => res.sendStatus(204)
);

// JSON parsing
app.use(bodyParser.json());

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
// const PORT = process.env.PORT || 3001;
// app.listen(PORT, () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });

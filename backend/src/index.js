require('dotenv').config();
const express = require('express');
const db = require('./config/database');
const helmet = require('helmet');

const reservationsRouter = require('./api/routes/reservations');
const paymentsRouter = require('./api/routes/payments');
const guestsRouter = require('./api/routes/guests');
const housekeepingRouter = require('./api/routes/housekeeping');
const maintenanceRouter = require('./api/routes/maintenance');
const staffRouter = require('./api/routes/staff');
const schedulesRouter = require('./api/routes/schedules');
const reportsRouter = require('./api/routes/reports');
const adminRouter = require('./api/routes/admin');
const usersRouter = require('./api/routes/users');
const channexRouter = require('./api/routes/channex');
const ratesRouter = require('./api/routes/rates'); // Added rates router import
const aiRouter = require('./api/routes/ai');
const accountingRouter = require('./api/routes/accounting');

// ...


const cors = require('cors');

// ... other imports
const stripeWebhookRouter = require('./api/routes/stripeWebhook');

const app = express();
const port = process.env.PORT || 5000;

// Stripe Webhook MUST be before express.json()
app.use('/api/webhook', express.raw({ type: 'application/json' }), stripeWebhookRouter);

app.use(express.json());

app.use(cors());

// Security Headers
app.use(helmet({
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Add trusted external scripts here (Stripe, Analytics, etc.)
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  xFrameOptions: { action: "sameorigin" },
  xContentTypeOptions: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
}));

const { protect } = require('./middleware/auth');

app.use('/api/reservations', protect, reservationsRouter);
app.use('/api/payments', protect, paymentsRouter);
app.use('/api/guests', protect, guestsRouter);
app.use('/api/housekeeping', protect, housekeepingRouter);
app.use('/api/maintenance', protect, maintenanceRouter);
app.use('/api/staff', protect, staffRouter);
app.use('/api/schedules', protect, schedulesRouter);
app.use('/api/reports', protect, reportsRouter);
app.use('/api/admin', protect, adminRouter);
app.use('/api/users', protect, usersRouter);
app.use('/api/channex', protect, channexRouter);
app.use('/api/rates', protect, ratesRouter);
app.use('/api/ai', protect, aiRouter); // Protected to save costs
app.use('/api/accounting', protect, accountingRouter);
app.use('/api/overview', protect, require('./api/routes/overview'));

app.get('/', (req, res) => {
  res.send('Welcome to the StaySyncGold API!');
});

// Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({
      message: 'Database connection successful!',
      time: result.rows[0].now,
    });
  } catch (err) {
    console.error('Database connection failed:', err); // Error log kept
    res.status(500).json({
      message: 'Database connection failed!',
      // Hide stack trace in production
      // TEMPORARY: Show full error for debugging
      error: err.message,
      code: err.code,
      detail: err.detail
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

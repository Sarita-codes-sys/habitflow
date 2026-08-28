import express from 'express';
import cors from 'cors';
import { prisma } from './prisma';

import authRouter from './routes/auth';
import habitsRouter from './routes/habits';
import analyticsRouter from './routes/analytics';
import insightsRouter from './routes/insights';
import profileRouter from './routes/profile';
import reportsRouter from './routes/reports';
import categoriesRouter from './routes/categories';

import './services/ReminderService'; // Starts the cron jobs

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/categories', categoriesRouter);

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

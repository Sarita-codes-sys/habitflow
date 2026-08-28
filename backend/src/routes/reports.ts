import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/export', async (req, res) => {
  const csvData = "Habit,Date,Status\nMorning Run,2026-07-23,Completed\n";
  res.header('Content-Type', 'text/csv');
  res.attachment('habitflow-report.csv');
  res.send(csvData);
});

export default router;

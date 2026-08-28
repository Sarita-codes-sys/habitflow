import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.post('/generate', async (req, res) => {
  const userId = req.user!.id;
  
  const h1 = await prisma.habit.create({ data: { userId, name: "Morning Run", frequency: "DAILY" } });
  const h2 = await prisma.habit.create({ data: { userId, name: "Read 20 Pages", frequency: "DAILY" } });
  
  await prisma.streak.create({ data: { habitId: h1.id, currentStreak: 5, longestStreak: 12 } });
  await prisma.streak.create({ data: { habitId: h2.id, currentStreak: 3, longestStreak: 4 } });
  
  await prisma.badge.create({ data: { userId, badgeType: "FIRST_HABIT" } });
  await prisma.insight.create({ data: { userId, ruleId: "STREAK_RISK", message: "Your 'Morning Run' streak may break!" } });
  
  res.json({ message: "Mock data generated successfully." });
});

export default router;

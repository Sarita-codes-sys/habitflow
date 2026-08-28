import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/productivity-score', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id, archived: false },
    include: { streak: true, completions: { where: { completedDate: { gte: new Date(Date.now() - 30 * 86400000) } } } }
  });

  if (habits.length === 0) {
    return res.json({ score: 0, trend: 'flat' });
  }

  // Simplified logic for mock
  let score = 0;
  habits.forEach(h => {
    score += (h.streak?.currentStreak || 0) * 10;
  });
  
  res.json({ score: Math.min(score, 100), trend: 'up' });
});

router.get('/heatmap', async (req, res) => {
  const { year, month } = req.query;
  res.json({ year: Number(year), month: Number(month), days: {} });
});

router.get('/heatmap-global', async (req, res) => {
  const daysToFetch = 180;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysToFetch);
  
  const completions = await prisma.habitCompletion.groupBy({
    by: ['completedDate'],
    where: {
      habit: { userId: req.user!.id },
      completedDate: { gte: startDate }
    },
    _count: { habitId: true }
  });

  const habitsCount = await prisma.habit.count({
    where: { userId: req.user!.id, archived: false }
  });

  const days: Record<string, number> = {};
  completions.forEach(c => {
    const dateStr = c.completedDate.toISOString().split('T')[0];
    const rate = habitsCount > 0 ? (c._count.habitId / habitsCount) : 0;
    days[dateStr] = Math.min(rate, 1.0);
  });

  res.json({ days });
});

router.get('/xp', async (req, res) => {
  const totalCompletions = await prisma.habitCompletion.count({
    where: { habit: { userId: req.user!.id } }
  });

  const totalXP = totalCompletions * 20; // 20 XP per completion
  const xpPerLevel = 1000;
  
  const level = Math.floor(totalXP / xpPerLevel) + 1;
  const currentLevelXP = totalXP % xpPerLevel;
  
  res.json({
    level,
    currentXP: currentLevelXP,
    nextLevelXP: xpPerLevel,
    totalXP
  });
});

router.get('/badges', async (req, res) => {
  const badges = await prisma.badge.findMany({
    where: { userId: req.user!.id }
  });
  res.json(badges.map(b => b.badgeType));
});

router.get('/daily', async (req, res) => {
  const days = 14;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const completions = await prisma.habitCompletion.findMany({
    where: {
      habit: { userId: req.user!.id },
      completedDate: { gte: startDate }
    }
  });

  const countsByDate = completions.reduce((acc, c) => {
    const dateStr = c.completedDate.toISOString().split('T')[0];
    acc[dateStr] = (acc[dateStr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    result.push({ name: dayName, date: dateStr, completed: countsByDate[dateStr] || 0 });
  }

  res.json(result);
});

router.get('/categories', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id, archived: false },
    include: { category: true }
  });

  const categoryCounts = habits.reduce((acc, h) => {
    const catName = h.category?.name || 'Uncategorized';
    acc[catName] = (acc[catName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const result = Object.entries(categoryCounts).map(([name, value], index) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];
    return { name, value, color: colors[index % colors.length] };
  });

  res.json(result);
});

router.get('/xp-growth', async (req, res) => {
  const days = 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const completions = await prisma.habitCompletion.findMany({
    where: {
      habit: { userId: req.user!.id },
      completedDate: { gte: startDate }
    },
    orderBy: { completedDate: 'asc' }
  });

  const baseCompletions = await prisma.habitCompletion.count({
    where: {
      habit: { userId: req.user!.id },
      completedDate: { lt: startDate }
    }
  });

  let currentXP = baseCompletions * 20;
  
  const xpByDate = completions.reduce((acc, c) => {
    const dateStr = c.completedDate.toISOString().split('T')[0];
    acc[dateStr] = (acc[dateStr] || 0) + 20;
    return acc;
  }, {} as Record<string, number>);

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    if (xpByDate[dateStr]) {
      currentXP += xpByDate[dateStr];
    }
    
    result.push({ date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), xp: currentXP });
  }

  res.json(result);
});

export default router;

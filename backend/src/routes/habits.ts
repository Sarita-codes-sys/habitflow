import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id, archived: false },
    include: { 
      streak: true, 
      category: true,
      completions: {
        where: { completedDate: { gte: new Date(Date.now() - 7 * 86400000) } },
        select: { completedDate: true }
      }
    }
  });

  const response = habits.map(h => ({
    id: h.id,
    name: h.name,
    categoryId: h.categoryId,
    categoryName: h.category?.name || 'General',
    frequency: h.frequency,
    targetPerWeek: h.targetPerWeek,
    timeOfDay: h.timeOfDay,
    archived: h.archived,
    createdAt: h.createdAt,
    currentStreak: h.streak?.currentStreak || 0,
    longestStreak: h.streak?.longestStreak || 0,
    lastCompletedDate: h.streak?.lastCompletedDate?.toISOString().split('T')[0] || null,
    completions: h.completions.map(c => c.completedDate.toISOString().split('T')[0])
  }));

  res.json(response);
});

router.post('/', async (req, res) => {
  const { name, categoryId, frequency, targetPerWeek, timeOfDay } = req.body;
  const habit = await prisma.habit.create({
    data: {
      userId: req.user!.id,
      name,
      categoryId,
      frequency,
      targetPerWeek,
      timeOfDay,
      streak: {
        create: { currentStreak: 0, longestStreak: 0 }
      }
    },
    include: { streak: true }
  });
  res.status(201).json(habit);
});

router.post('/:id/complete', async (req, res) => {
  const habitId = BigInt(req.params.id);
  const dateStr = req.body.date || new Date().toISOString().split('T')[0];
  const date = new Date(dateStr);

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.user!.id } });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  const exists = await prisma.habitCompletion.findFirst({ where: { habitId, completedDate: date } });
  if (exists) return res.status(409).json({ message: 'Already completed' });

  await prisma.habitCompletion.create({ data: { habitId, completedDate: date } });

  // Recalculate streak
  let streak = await prisma.streak.findUnique({ where: { habitId } });
  if (!streak) streak = await prisma.streak.create({ data: { habitId, currentStreak: 0, longestStreak: 0 } });

  const lastCompleted = streak.lastCompletedDate;
  let currentStreak = streak.currentStreak;

  const msInDay = 86400000;
  const yesterday = new Date(date.getTime() - msInDay);

  if (!lastCompleted) {
    currentStreak = 1;
  } else if (lastCompleted.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) {
    currentStreak += 1;
  } else if (lastCompleted < date) {
    currentStreak = 1; // reset
  }

  const longestStreak = Math.max(streak.longestStreak, currentStreak);

  streak = await prisma.streak.update({
    where: { id: streak.id },
    data: {
      currentStreak,
      longestStreak,
      lastCompletedDate: (!lastCompleted || date > lastCompleted) ? date : lastCompleted
    }
  });

  // Achievement Badges Logic
  const awardBadge = async (badgeType: string) => {
    try {
      await prisma.badge.create({ data: { userId: req.user!.id, badgeType } });
    } catch (e) {
      // Ignore if already exists (Unique constraint violation)
    }
  };

  // 1. First Habit
  await awardBadge('FIRST_HABIT');

  // 2. 7 Day Streak
  if (currentStreak >= 7) {
    await awardBadge('7_DAY_STREAK');
  }

  // 3. Early Bird (before 8 AM)
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 8) {
    await awardBadge('EARLY_BIRD');
  }

  // 4. Category specific badges
  const category = await prisma.category.findUnique({ where: { id: habit.categoryId || 0n } });
  const categoryName = category?.name.toLowerCase() || habit.name.toLowerCase();
  
  if (categoryName.includes('study') || categoryName.includes('read')) {
    await awardBadge('BOOKWORM');
  }
  if (categoryName.includes('water')) {
    await awardBadge('HYDRATION_HERO');
  }

  res.json({ habitId, currentStreak: streak.currentStreak, longestStreak: streak.longestStreak });
});

router.put('/:id', async (req, res) => {
  const habitId = BigInt(req.params.id);
  const { name, categoryId, frequency, targetPerWeek, timeOfDay } = req.body;

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.user!.id } });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  const updated = await prisma.habit.update({
    where: { id: habitId },
    data: { name, categoryId, frequency, targetPerWeek, timeOfDay }
  });

  // For Prisma BigInt to JSON serialization we map it if needed, but it seems there's a custom serializer or BigInt.prototype.toJSON.
  // We'll just return it directly as was done previously.
  res.json({ success: true, habit: { ...updated, id: updated.id.toString(), userId: updated.userId.toString(), categoryId: updated.categoryId?.toString() } });
});

router.delete('/:id', async (req, res) => {
  const habitId = BigInt(req.params.id);

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.user!.id } });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  // Delete all related records in a transaction
  await prisma.$transaction([
    prisma.habitCompletion.deleteMany({ where: { habitId } }),
    prisma.streak.deleteMany({ where: { habitId } }),
    prisma.reminder.deleteMany({ where: { habitId } }),
    prisma.habit.delete({ where: { id: habitId } })
  ]);

  res.json({ success: true });
});

router.delete('/:id/complete/:date', async (req, res) => {
  const habitId = BigInt(req.params.id);
  const dateStr = req.params.date;
  const date = new Date(dateStr);

  const habit = await prisma.habit.findFirst({ where: { id: habitId, userId: req.user!.id } });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  // Delete the completion
  await prisma.habitCompletion.deleteMany({
    where: { habitId, completedDate: date }
  });

  // Note: Properly recalculating streak retroactively is complex. 
  // For simplicity, we just delete the completion. A cron or separate job usually rebuilds streaks.
  // Alternatively, we could recalculate if it was the last completion date.
  const streak = await prisma.streak.findUnique({ where: { habitId } });
  if (streak && streak.lastCompletedDate && streak.lastCompletedDate.toISOString().split('T')[0] === dateStr) {
    // If we deleted the most recent one, just reset current streak to 0 for safety 
    // (a full recalculation would require fetching all completions)
    await prisma.streak.update({
      where: { id: streak.id },
      data: { currentStreak: 0, lastCompletedDate: null }
    });
  }

  res.json({ success: true });
});

export default router;

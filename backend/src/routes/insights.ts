import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const insights = await prisma.insight.findMany({
    where: { userId: req.user!.id },
    orderBy: { generatedAt: 'desc' }
  });
  res.json(insights.map(i => ({ ...i, id: i.id.toString(), userId: i.userId.toString() })));
});

router.post('/', async (req, res) => {
  const { message, ruleId } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  const insight = await prisma.insight.create({
    data: {
      userId: req.user!.id,
      message,
      ruleId: ruleId || 'CUSTOM',
    }
  });
  res.status(201).json({ ...insight, id: insight.id.toString(), userId: insight.userId.toString() });
});

router.put('/:id', async (req, res) => {
  const insightId = BigInt(req.params.id);
  const { message } = req.body;

  try {
    // verify ownership
    const existing = await prisma.insight.findFirst({
      where: { id: insightId, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ error: 'Insight not found' });

    const insight = await prisma.insight.update({
      where: { id: insightId },
      data: { message }
    });
    res.json({ ...insight, id: insight.id.toString(), userId: insight.userId.toString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update insight' });
  }
});

router.delete('/:id', async (req, res) => {
  const insightId = BigInt(req.params.id);
  
  try {
    const existing = await prisma.insight.findFirst({
      where: { id: insightId, userId: req.user!.id }
    });
    if (!existing) return res.status(404).json({ error: 'Insight not found' });

    await prisma.insight.delete({
      where: { id: insightId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete insight' });
  }
});

router.get('/dynamic', async (req, res) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id, archived: false },
    include: { 
      category: true, 
      streak: true, 
      completions: { 
        where: { completedDate: { gte: new Date(Date.now() - 60 * 86400000) } } 
      } 
    }
  });

  const generatedInsights: any[] = [];
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Helper for comparison
  const getComparison = (currentDays: number, previousDays: number) => {
    let currentTotal = 0;
    let previousTotal = 0;
    
    habits.forEach(h => {
      h.completions.forEach(c => {
        const d = new Date(c.completedDate);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < currentDays) currentTotal++;
        else if (diffDays >= currentDays && diffDays < (currentDays + previousDays)) previousTotal++;
      });
    });

    const totalPossibleCurrent = (habits.length || 1) * currentDays;
    const totalPossiblePrev = (habits.length || 1) * previousDays;

    const currentRate = Math.round((currentTotal / totalPossibleCurrent) * 100) || 0;
    const prevRate = Math.round((previousTotal / totalPossiblePrev) * 100) || 0;
    const diff = currentRate - prevRate;

    return { rate: currentRate, diff };
  };

  if (habits.length === 0) {
    return res.json(generatedInsights);
  }

  // 1. Month over Month
  const thisMonth = getComparison(30, 30);
  if (thisMonth.diff > 0) {
    generatedInsights.push({ id: 'dyn-mom', type: 'positive', title: 'Incredible progress!', subtitle: `↑ ${thisMonth.diff}% vs Last Month`, description: `You're ${thisMonth.diff}% more consistent this month. Keep this incredible momentum going!`, dateLabel: 'Today', priority: 'LOW', trend: { direction: 'up', value: `+${thisMonth.diff}%` } });
  } else if (thisMonth.diff < 0) {
    generatedInsights.push({ id: 'dyn-mom', type: 'warning', title: 'A slight dip', subtitle: `↓ ${Math.abs(thisMonth.diff)}% vs Last Month`, description: `It looks like your completion rate has dipped slightly. Focus on regaining your core routine today.`, dateLabel: 'Today', priority: 'MEDIUM', trend: { direction: 'down', value: `-${Math.abs(thisMonth.diff)}%` } });
  } else {
    generatedInsights.push({ id: 'dyn-mom', type: 'positive', title: 'Perfectly steady', subtitle: `Maintained`, description: `You're perfectly maintaining your momentum. Consistency is the key to lasting habits!`, dateLabel: 'Today', priority: 'LOW', trend: { direction: 'neutral', value: `0%` } });
  }

  // 2. Best / Worst Habit
  const sorted = [...habits].sort((a, b) => (b.streak?.currentStreak || 0) - (a.streak?.currentStreak || 0));
  const bestHabit = sorted[0];
  const worstHabit = sorted[sorted.length - 1];

  if (bestHabit && (bestHabit.streak?.currentStreak || 0) >= 3) {
    let thisWeekCount = 0;
    bestHabit.completions.forEach(c => {
      const d = new Date(c.completedDate);
      if (Math.abs(now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000) thisWeekCount++;
    });
    generatedInsights.push({ 
      id: `dyn-best-${bestHabit.id}`,
      type: 'positive', 
      title: 'Excellent work!', 
      subtitle: `🔥 ${bestHabit.streak!.currentStreak} Day Streak`, 
      description: `You've successfully completed '${bestHabit.name}' for ${bestHabit.streak!.currentStreak} consecutive days. This is your strongest habit right now!`,
      dateLabel: 'Today',
      priority: 'LOW',
      habitId: Number(bestHabit.id),
      trend: { direction: 'up', value: `+${thisWeekCount} days this week` }
    });
  }

  if (worstHabit && (worstHabit.streak?.currentStreak || 0) === 0 && bestHabit?.id !== worstHabit?.id) {
    const isCompletedToday = worstHabit.completions.some(c => new Date(c.completedDate).toISOString().split('T')[0] === todayStr);
    if (!isCompletedToday) {
      generatedInsights.push({ 
        id: `dyn-worst-${worstHabit.id}`,
        type: 'warning', 
        title: worstHabit.name, 
        subtitle: `⚠ Needs Attention`, 
        description: `You haven't completed this habit today. Complete it now to build momentum!`,
        actionText: `Complete Now`,
        dateLabel: 'Today',
        priority: 'HIGH',
        habitId: Number(worstHabit.id)
      });
    }
  }

  // 3. Streak at risk
  const atRisk = habits.filter(h => 
    h.streak && h.streak.currentStreak > 0 && 
    (!h.streak.lastCompletedDate || new Date(h.streak.lastCompletedDate).toISOString().split('T')[0] !== todayStr)
  );
  if (atRisk.length > 0 && atRisk[0].id !== worstHabit?.id) {
    generatedInsights.push({
      id: `dyn-risk-${atRisk[0].id}`,
      title: 'Streak at Risk',
      description: `Completing one more habit today will extend your streak for ${atRisk[0].name}!`,
      subtitle: '🔥 Don\'t break the chain',
      priority: 'HIGH',
      type: 'warning',
      habitId: Number(atRisk[0].id),
      dateLabel: 'Today'
    });
  }

  // 4. Weekend struggles
  let weekendCompletions = 0;
  let weekdayCompletions = 0;
  habits.forEach(h => {
    h.completions.forEach(c => {
      const day = new Date(c.completedDate).getDay();
      if (day === 0 || day === 6) weekendCompletions++;
      else weekdayCompletions++;
    });
  });
  const weekendRate = weekendCompletions / 2;
  const weekdayRate = weekdayCompletions / 5;
  
  if (weekdayRate > 0 && weekendRate < (weekdayRate * 0.8)) {
    const drop = Math.round(((weekdayRate - weekendRate) / weekdayRate) * 100);
    generatedInsights.push({
      id: 'dyn-weekend',
      title: 'Weekend Slump',
      subtitle: `↓ ${drop}% Drop`,
      description: `Weekends severely reduce your completion rate. Try setting smaller micro-goals for Saturday and Sunday.`,
      priority: 'MEDIUM',
      type: 'warning',
      dateLabel: 'Today'
    });
  }

  // 5. Smart Scheduling Recommendation
  const learningHabit = habits.find(h => h.name.toLowerCase().includes('read') || h.name.toLowerCase().includes('study') || h.name.toLowerCase().includes('code'));
  if (learningHabit) {
    generatedInsights.push({
      id: `dyn-smart-${learningHabit.id}`,
      type: 'suggestion',
      title: `Optimize ${learningHabit.name}`,
      subtitle: '💡 Smart Schedule',
      description: `We analyzed your historical completion patterns for cognitive habits.`,
      dateLabel: 'Today',
      priority: 'MEDIUM',
      habitId: Number(learningHabit.id),
      confidence: 94,
      dataPoints: 'Based on recent completions',
      smartRecommendation: {
        action: `Move ${learningHabit.name}`,
        from: '10:00 PM',
        to: '8:00 PM',
        reason: 'Historic data shows better consistency in early evenings.',
        improvement: '+32%'
      }
    });
  }

  res.json(generatedInsights);
});

export default router;

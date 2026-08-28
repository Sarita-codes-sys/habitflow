import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    include: { badges: true }
  });
  
  if (!user) return res.status(404).json({ message: 'User not found' });
  
  res.json({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    badges: user.badges
  });
});

export default router;

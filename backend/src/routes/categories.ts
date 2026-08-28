import { Router } from 'express';
import { prisma } from '../prisma';
import { authMiddleware } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' }
    });
    // For Prisma BigInt to JSON serialization we convert to string or number (if safe)
    // The id is BigInt, so let's map it.
    res.json(categories.map(c => ({
      ...c,
      id: c.id.toString()
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Create category
router.post('/', async (req, res) => {
  const { name, icon, color } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }
  
  try {
    const category = await prisma.category.create({
      data: { name, icon, color }
    });
    res.status(201).json({ ...category, id: category.id.toString() });
  } catch (error) {
    res.status(400).json({ error: 'Failed to create category (name might already exist)' });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  const categoryId = BigInt(req.params.id);
  const { name, icon, color } = req.body;
  
  try {
    const category = await prisma.category.update({
      where: { id: categoryId },
      data: { name, icon, color }
    });
    res.json({ ...category, id: category.id.toString() });
  } catch (error) {
    res.status(404).json({ error: 'Category not found or failed to update' });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  const categoryId = BigInt(req.params.id);
  
  try {
    // Check if it's being used by habits
    const habitsUsing = await prisma.habit.count({
      where: { categoryId }
    });
    
    if (habitsUsing > 0) {
      // Remove category from these habits before deleting, or return error
      await prisma.habit.updateMany({
        where: { categoryId },
        data: { categoryId: null }
      });
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: 'Category not found' });
  }
});

export default router;

import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || '8f2a5b6d9c3e4a1f7b0d2e8c5a9b4f1e6d3c7a0b9f2e5d8c1a4b7f0e3d6c9b2a';

router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName }
    });

    res.status(201).json({ id: user.id, email: user.email, displayName: user.displayName, createdAt: user.createdAt });
  } catch (error) {
    res.status(400).json({ message: 'Registration failed', error });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ sub: user.id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ accessToken: token });
  } catch (error) {
    res.status(400).json({ message: 'Login failed', error });
  }
});

export default router;

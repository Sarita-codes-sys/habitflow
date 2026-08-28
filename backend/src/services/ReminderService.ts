import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { prisma } from '../prisma';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.mailtrap.io',
  port: Number(process.env.MAIL_PORT) || 2525,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD
  }
});

// Run every minute
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    // Normalize to HH:mm for simple comparison
    // In production we would use UTC matching
    const reminders = await prisma.reminder.findMany({
      where: { enabled: true },
      include: { user: true, habit: true }
    });

    for (const reminder of reminders) {
      if (!reminder.user || !reminder.habit) continue;
      
      const mailOptions = {
        from: 'no-reply@habitflow.com',
        to: reminder.user.email,
        subject: `HabitFlow Reminder: Time for ${reminder.habit.name}`,
        text: `Hi there,\n\nJust a quick reminder that it's time to complete your habit: ${reminder.habit.name}.\n\nKeep your streak alive!\n\n- The HabitFlow Team`
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Reminder sent to ${reminder.user.email}`);
      } catch (err) {
        console.error(`Failed to send email to ${reminder.user.email}`, err);
      }
    }
  } catch (error) {
    console.error("Cron Error", error);
  }
});

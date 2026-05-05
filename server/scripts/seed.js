import './config/env.js';
import { connectDB, sequelize } from './config/database.js';
import bcrypt from 'bcryptjs';
import {
  User, Educator, Course, Chapter, Lecture, Purchase, Enrollment,
  CourseProgress, LectureCompletion, CourseRating, SubscriptionPlan,
  EducatorSubscription, CommissionSettings, RevenueTracking, UserActivity
} from './models/index.js';

const seed = async () => {
  try {
    console.log("🌱 Seeding database...");
    await connectDB();
    await sequelize.sync({ alter: true });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('123456', salt);

    // 1. Commission Settings
    await CommissionSettings.upsert({
      id: 1,
      platformPercentage: 15.00,
      certificateFee: 50.00
    });

    // 2. Subscription Plans
    const plans = [
      { planName: 'BASIC', durationMonths: 1, price: 0, canCreateAssignments: false, canHostLiveClasses: false },
      { planName: 'STANDARD', durationMonths: 1, price: 499, canCreateAssignments: true, canHostLiveClasses: false },
      { planName: 'PREMIUM', durationMonths: 1, price: 999, canCreateAssignments: true, canHostLiveClasses: true }
    ];

    const dbPlans = [];
    for (const p of plans) {
      const [plan] = await SubscriptionPlan.findOrCreate({
        where: { planName: p.planName },
        defaults: p
      });
      dbPlans.push(plan);
    }

    // 3. Admin Account
    const [adminUser] = await User.findOrCreate({
      where: { email: 'admin@test.com' },
      defaults: {
        id: 'admin_123',
        name: 'System Admin',
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      }
    });

    // 4. Educator Account
    const [educatorUser] = await User.findOrCreate({
      where: { email: 'educator@test.com' },
      defaults: {
        id: 'edu_123',
        name: 'John Educator',
        password: hashedPassword,
        role: 'educator',
        isVerified: true
      }
    });

    await Educator.upsert({
      userId: educatorUser.id,
      bio: 'Expert in full-stack development',
      status: 'active'
    });

    // Give Educator a PREMIUM subscription (6 months active)
    const premiumPlan = dbPlans.find(p => p.planName === 'PREMIUM');
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    await EducatorSubscription.upsert({
      educatorId: educatorUser.id,
      planId: premiumPlan.id,
      planName: 'PREMIUM',
      durationMonths: 6,
      startDate,
      endDate,
      amountPaid: 5000, // bulk price or whatever
      status: 'active'
    });

    // 5. Student Account
    const [studentUser] = await User.findOrCreate({
      where: { email: 'student@test.com' },
      defaults: {
        id: 'stu_123',
        name: 'Jane Student',
        password: hashedPassword,
        role: 'student',
        isVerified: true
      }
    });

    // 6. Dummy Courses
    const courses = [
      { 
        id: 'c1', 
        courseTitle: 'React for Beginners', 
        courseDescription: '<p>Master React basics in this comprehensive guide.</p>',
        courseThumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
        coursePrice: 499, 
        isPublished: true, 
        educator: educatorUser.id 
      },
      { 
        id: 'c2', 
        courseTitle: 'Advanced Node.js', 
        courseDescription: '<p>Learn backend scaling, streams, and performance.</p>',
        courseThumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
        coursePrice: 799, 
        isPublished: true, 
        educator: educatorUser.id 
      },
      { 
        id: 'c3', 
        courseTitle: 'Mastering MySQL', 
        courseDescription: '<p>Deep dive into relational databases and query optimization.</p>',
        courseThumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
        coursePrice: 299, 
        isPublished: true, 
        educator: educatorUser.id 
      }
    ];

    for (const c of courses) {
      await Course.upsert(c);
      // Add one chapter and lecture for each
      const [chapter] = await Chapter.findOrCreate({
        where: { courseId: c.id, chapterTitle: 'Introduction' },
        defaults: { chapterOrder: 1, chapterId: 'ch_' + c.id }
      });
      await Lecture.findOrCreate({
        where: { chapterId: chapter.id, lectureTitle: 'Getting Started' },
        defaults: { lectureId: 'lec_' + c.id, lectureDuration: 10, lectureUrl: 'dQw4w9WgXcQ', isPreviewFree: true, lectureOrder: 1 }
      });
    }

    // 7. Enroll Student in one course
    const targetCourse = courses[0];
    await Enrollment.findOrCreate({
      where: { userId: studentUser.id, courseId: targetCourse.id }
    });
    await Purchase.findOrCreate({
      where: { userId: studentUser.id, courseId: targetCourse.id },
      defaults: { amount: targetCourse.coursePrice, status: 'completed', commissionAmount: 75, educatorAmount: 424 }
    });

    // 8. Add rating
    await CourseRating.findOrCreate({
      where: { userId: studentUser.id, courseId: targetCourse.id },
      defaults: { rating: 5 }
    });

    // 9. Initial Revenue Entry
    await RevenueTracking.upsert({
      id: 'rev_1',
      totalRevenue: targetCourse.coursePrice,
      totalCommission: 75,
      totalEducatorEarnings: 424
    });

    console.log("✅ Seeding complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seed();

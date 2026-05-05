import { sequelize } from '../config/database.js';

const optimizeDatabase = async () => {
    try {
        console.log('--- Starting Database Optimization ---');
        
        const queryInterface = sequelize.getQueryInterface();

        // 1. Add Indexes for performance
        console.log('Adding performance indexes...');
        
        await queryInterface.addIndex('Courses', ['category']).catch(() => console.log('Index on Courses.category already exists or table missing.'));
        await queryInterface.addIndex('Courses', ['educator']).catch(() => console.log('Index on Courses.educator already exists.'));
        
        await queryInterface.addIndex('Enrollments', ['userId']).catch(() => console.log('Index on Enrollments.userId already exists.'));
        await queryInterface.addIndex('Enrollments', ['courseId']).catch(() => console.log('Index on Enrollments.courseId already exists.'));
        
        await queryInterface.addIndex('Purchases', ['userId']).catch(() => console.log('Index on Purchases.userId already exists.'));
        await queryInterface.addIndex('Purchases', ['courseId']).catch(() => console.log('Index on Purchases.courseId already exists.'));
        await queryInterface.addIndex('Purchases', ['status']).catch(() => console.log('Index on Purchases.status already exists.'));

        await queryInterface.addIndex('Educators', ['userId']).catch(() => console.log('Index on Educators.userId already exists.'));

        console.log('--- Database Optimization Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('Optimization failed:', error);
        process.exit(1);
    }
};

optimizeDatabase();

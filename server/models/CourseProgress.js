import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CourseProgress = sequelize.define('CourseProgress', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  completed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId'],
    }
  ]
});

export default CourseProgress;

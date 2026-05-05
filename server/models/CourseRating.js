import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CourseRating = sequelize.define('CourseRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  rating: {
    type: DataTypes.INTEGER,
    validate: {
      min: 1,
      max: 5,
    },
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default CourseRating;

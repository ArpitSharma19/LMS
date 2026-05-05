import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  courseDescription: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  courseThumbnail: {
    type: DataTypes.STRING,
  },
  coursePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  isPublished: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  discount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100,
    },
  },
  educator: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'General',
  },
  ratingAverage: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
});

export default Course;

import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Enrollment = sequelize.define('Enrollment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    }
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Courses',
      key: 'id',
    }
  }
}, {
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'courseId'],
    }
  ]
});

export default Enrollment;

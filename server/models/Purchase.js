import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Purchase = sequelize.define('Purchase', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  commissionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
  educatorAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00,
  },
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['userId'],
    },
    {
      fields: ['courseId'],
    },
    {
      fields: ['status'],
    }
  ]
});

export default Purchase;

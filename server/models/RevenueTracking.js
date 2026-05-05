import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const RevenueTracking = sequelize.define('RevenueTracking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  totalRevenue: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  totalCommission: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
  totalEducatorEarnings: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
  },
}, {
  timestamps: true,
});

export default RevenueTracking;

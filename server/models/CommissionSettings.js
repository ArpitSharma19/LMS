import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const CommissionSettings = sequelize.define('CommissionSettings', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  platformPercentage: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 20.00, // Default 20%
  },
  certificateFee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 50.00,
  },
}, {
  timestamps: true,
});

export default CommissionSettings;

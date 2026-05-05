import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  role: {
    type: DataTypes.ENUM('student', 'educator', 'admin'),
    defaultValue: 'student',
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'blocked'),
    defaultValue: 'active',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  otpExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  streak: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  lastActiveDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  completedDates: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('completedDates');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('completedDates', JSON.stringify(val));
    },
  },
}, {
  timestamps: true,
});

export default User;

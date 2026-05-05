import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ChatHistory = sequelize.define('ChatHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'assistant', 'system'),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default ChatHistory;

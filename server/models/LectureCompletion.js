import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const LectureCompletion = sequelize.define('LectureCompletion', {
  progressId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lectureId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('completed', 'skipped', 'pending'),
    defaultValue: 'completed'
  },
  completionDate: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

export default LectureCompletion;

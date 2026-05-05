import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Lecture = sequelize.define('Lecture', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  chapterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lectureId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lectureTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lectureDuration: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  lectureUrl: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  isPreviewFree: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
  },
  lectureOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  timestamps: true,
});

export default Lecture;

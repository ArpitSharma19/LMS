import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Chapter = sequelize.define('Chapter', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  courseId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  chapterId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  chapterOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  chapterTitle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  timestamps: true,
});

export default Chapter;

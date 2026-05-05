import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Educator = sequelize.define('Educator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'Users',
      key: 'id',
    }
  },
  bio: {
    type: DataTypes.TEXT,
  },
  specialty: {
    type: DataTypes.STRING,
  },
  qualification: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  experience: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
  },
  subjects: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const raw = this.getDataValue('subjects');
      try { return raw ? JSON.parse(raw) : []; } catch { return []; }
    },
    set(val) {
      this.setDataValue('subjects', Array.isArray(val) ? JSON.stringify(val) : val);
    },
  },
  portfolioLinks: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'active', 'rejected'),
    defaultValue: 'pending',
  },
  approvedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  followersCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
});

export default Educator;

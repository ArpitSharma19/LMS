import { Sequelize } from "sequelize";

if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_HOST) {
  throw new Error("❌ Missing DB environment variables — check .env");
}

console.log("🔍 ENV CHECK:", {
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST,
  DB_PORT: process.env.DB_PORT,
});

export const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: "mysql",
    logging: (msg) => console.log(`💾 SQL: ${msg}`),
  }
);

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL Connected");
  } catch (error) {
    console.error("❌ DB Error:", error.message);
    process.exit(1);
  }
};
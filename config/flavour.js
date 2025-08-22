import dotenv from "dotenv";
dotenv.config();

const ENV = process.env.NODE_ENV || "LOCAL";
const PREFIX = ENV.toUpperCase();

function getEnv(key, defaultValue = undefined, required = false) {
  const value = process.env[`${PREFIX}_${key}`] || defaultValue;
  if (required && (value === undefined || value === "")) {
    throw new Error(`Missing required env variable: ${PREFIX}_${key}`);
  }
  return value;
}
const CONFIG = {
  // Port and URLs
  PORT: parseInt(getEnv("PORT", "3000"), 10),
  API_URL: getEnv("API_URL", ""),
  ADMIN_URL: getEnv("ADMIN_URL", ""),
  STATIC_ROUTE: getEnv("STATIC_ROUTE", ""),

  // SMTP Configuration
  SMTP_HOST: getEnv("SMTP_HOST", "", true),
  SMTP_PORT: parseInt(getEnv("SMTP_PORT", "465"), 10),
  SMTP_FROM: getEnv("SMTP_FROM", "", true),
  SMTP_NAME: getEnv("SMTP_FROM_NAME", ""),
  SMTP_USER: getEnv("SMTP_USER", "", true),
  SMTP_PASS: getEnv("SMTP_PASS", "", true),
  SMTP_SECURE: getEnv("SMTP_SECURE", "true") === "true",

  // Database Configuration
  DB: {
    host: getEnv("DB_HOST", "localhost"),
    user: getEnv("DB_USER", "root"),
    password: getEnv("DB_PASS", ""),
    database: getEnv("DB_NAME", ""),
    connectionLimit: parseInt(getEnv("DB_CONN_LIMIT", "100"), 10),
    dateStrings: getEnv("DB_DATE_STRINGS", "true") === "true",
  },

  // Razorpay Keys
  RAZORPAY_KEY_ID: getEnv("RAZORPAY_KEY_ID", "", true),
  RAZORPAY_KEY_SECRET: getEnv("RAZORPAY_KEY_SECRET", "", true),

  // General Configuration (global, no prefix)
  APP_SECRET: process.env.APP_SECRET || "dummy",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
};

export { CONFIG };

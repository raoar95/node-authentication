export const DB_NAME = "LoginAuth";
export const PORT = process.env.PORT || 8000;
export const SERVER_URL = process.env.MONGODB_URI;

// Environment
export const NODE_ENV = process.env.NODE_ENV;

// Host
export const PROD_SERVER = process.env.PROD_SERVER;
export const LOCAL_SERVER = process.env.LOCAL_SERVER;

// Cors
export const CORS_ORIGIN =
  process.env.NODE_ENV === "development" ? LOCAL_SERVER : PROD_SERVER;

// Email Configuration
export const EMAIL = process.env.EMAIL;
export const PASSWORD = process.env.PASSWORD;

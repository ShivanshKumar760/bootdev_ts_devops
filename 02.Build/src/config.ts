import process from "node:process";

// Load the environment variables from the .env file
process.loadEnvFile();

// Helper function to assert that the environment variable is present
function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export type APIConfig = {
  fileserverHits: number;
  dbURL: string; // Typed as a string
};

// Create and export the stateful config object
export const config: APIConfig = {
  fileserverHits: 0,
  dbURL: envOrThrow("DB_URL")
};

import process from "node:process";
import type { MigrationConfig } from "drizzle-orm/migrator";

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

// Create the new nested configuration types
export type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

export type APIConfig = {
  fileserverHits: number;
  platform:string
  jwtSecret:string //Add jwtSecret type
  db: DBConfig; // Typed as a string
};

// Create and export the stateful config object
export const config: APIConfig = {
  fileserverHits: 0,
  platform:envOrThrow("PLATFORM"),
  jwtSecret:envOrThrow("JWT_SECRET"),// Load jwtSecret key
  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig:{
       migrationsFolder: "./src/migrations",
    }
  }
};

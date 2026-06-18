import dotenv from "dotenv";
import { execSync } from "child_process";

dotenv.config();

// Increase default timeout for integration tests (e.g. prisma db push, MinIO checks)
jest.setTimeout(10000);

// Enforce using the test database
if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
} else {
  console.error("DATABASE_URL_TEST is not defined in the environment.");
  process.exit(1);
}

// Override to point to the running docker container port (8080)
process.env.ALGAE_DETECTOR_LAMBDA_URL =
  "http://localhost:8080/2015-03-31/functions/function/invocations";

beforeAll(async () => {
  // Silence console error logs during tests
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});

  try {
    // Push the prisma schema to the test database to ensure it exists and matches
    execSync("npx prisma db push --accept-data-loss --skip-generate", {
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL_TEST,
      },
      stdio: "ignore",
    });
  } catch (error) {
    console.error("Failed to run prisma db push on test database:", error);
    process.exit(1);
  }

  try {
    const { minioClient, BUCKET } = require("@/lib/minio");
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET);
    }
  } catch (error) {
    console.error("Failed to ensure MinIO bucket exists:", error);
  }
});

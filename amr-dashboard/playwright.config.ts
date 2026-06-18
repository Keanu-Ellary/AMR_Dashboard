import {defineConfig} from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
    testDir: './tests/e2e',

    use: {
        baseURL: 'http://localhost:3000',
        headless: true,
        video: 'retain-on-failure'
    },

    webServer: {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
    },
});
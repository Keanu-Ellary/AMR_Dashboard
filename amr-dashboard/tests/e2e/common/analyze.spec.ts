import {test, expect} from '@playwright/test';

test.describe("Algae AI-Detection Page", () => {

    test.beforeEach(async ({page}) => {
        await page.goto('/analyze');

        await expect(page).toHaveURL("/analyze");
    });

    test("should display high confidence detection results", async ({page}) => {
        // mock success result
        await page.route('**/api/algae', async (route) => {
            const json = {
                data: {
                    results: [
                        [100, 100, 300, 400, 0.92]
                    ]
                }
            };
            await route.fulfill({json});
        });

        const fileChooser = page.waitForEvent('filechooser');
        await page.locator('input[type="file"]').click();
        const file = await fileChooser;

        await file.setFiles({
            name: 'test-algae.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data'),
        });

        const previewImage = page.locator('img[alt="Preview"]');
        await expect(previewImage).toBeVisible();

        await page.getByRole('button', {name: 'Analyze Image'}).click();

        // await expect(page.getByText('Running AI Model...')).toBeVisible();

        await expect(page.getByText('ALGAE DETECTED')).toBeVisible();
        await expect(page.getByText('Confidence: 92%')).toBeVisible();
    });

    test("should display no algae confidence detection results", async ({page}) => {
        // mock no detection result
        await page.route('**/api/algae', async (route) => {
            await route.fulfill({
                json: {data: {results: []}}
            });
        });

        const fileChooser = page.waitForEvent('filechooser');
        await page.locator('input[type="file"]').click();
        const file = await fileChooser;

        await file.setFiles({
            name: 'clean.jpg',
            mimeType: 'image/jpeg',
            buffer: Buffer.from('fake-image-data'),
        });

        const previewImage = page.locator('img[alt="Preview"]');
        await expect(previewImage).toBeVisible();

        await page.getByRole('button', {name: 'Analyze Image'}).click();

        await expect(page.getByText('NOT DETECTED')).toBeVisible();
        await expect(page.getByText('The AI model did not find any significant evidence')).toBeVisible();
    });
});

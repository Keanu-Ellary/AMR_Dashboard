import {test, expect} from '@playwright/test';

test.describe("Visualizations Page - Location Specific", () => {
    test('should render multi-graph layout', async ({page}) => {
        await page.route('**/api/site', async (route) => {
            await route.fulfill({
                json: {
                    sites: [
                        {id: 1, sampleName: "Site A", geoLocName: "Region 1", ph: 7.2, temperature: 19.5},
                        {id: 2, sampleName: "Site B", geoLocName: "Region 1", ph: 6.2, temperature: 21.6}
                    ]
                }
            });
        });

        await page.goto('/visualizations');

        const btnAdd = page.getByRole('button', {name: "Add New Visualization"});

        await expect(btnAdd).toBeVisible();
        await btnAdd.click();

        const graph = page.locator('div:has(> [class*="IndependentGraph"]), [data-testid*="graph"], .independent-graph-container');

        await expect(page.locator('aside, [class*="FilterPanel"]')).toBeVisible();
    });

    test("should create a graph - one site", async ({page}) => {
        // mock sites
        await page.route('**/api/site', async (route) => {
            await route.fulfill({
                json: {
                    sites: [
                        {id: 1, sampleName: "Station 1", geoLocName: "Sector 1", ph: 7.2, temperature: 22.6, collectionDate: Date.now()},
                    ]
                }
            });
        });

        await page.goto('/visualizations');

        await expect(page.getByText('No sites selected. Use the filter panel.')).toBeVisible();

        const dropDown = page.locator('aside select');
        await dropDown.selectOption('all');
        await expect(dropDown).toHaveValue('all');

        const metricWQI = page.locator('aside span:has-text("WQI")').first();
        await metricWQI.click();

        const search = page.getByPlaceholder('Search sites...');
        await search.fill('Sector');

        const visibleSites = page.locator('aside button', {hasText: 'Sector 1'});
        const notVisible = page.locator('aside button', {hasText: 'Sector 4'});

        await expect(visibleSites).toBeVisible();
        await expect(notVisible).not.toBeVisible();

        await visibleSites.click();

        await expect(visibleSites.locator('svg')).toBeVisible();
    });

    test("should create a graph - two sites", async ({page}) => {
        // mock sites
        await page.route('**/api/site', async (route) => {
            await route.fulfill({
                json: {
                    sites: [
                        {id: 1, sampleName: "Station 1", geoLocName: "Sector 1", ph: 7.2, temperature: 22.6, collectionDate: new Date("2026-04-01")},
                        {id: 1, sampleName: "Station 1", geoLocName: "Sector 2", ph: 6.7, temperature: 27.6, collectionDate: new Date("2026-04-01")},
                    ]
                }
            });
        });

        await page.goto('/visualizations');

        await expect(page.getByText('No sites selected. Use the filter panel.')).toBeVisible();

        const dropDown = page.locator('aside select');
        await dropDown.selectOption('all');
        await expect(dropDown).toHaveValue('all');

        const metricWQI = page.locator('aside span:has-text("WQI")').first();
        await metricWQI.click();

        const search = page.getByPlaceholder('Search sites...');
        await search.fill('Sector');

        const siteOne = page.locator('aside button', {hasText: 'Sector 1',});
        const siteTwo = page.locator('aside button', {hasText: 'Sector 2',});
        const notVisible = page.locator('aside button', {hasText: 'Sector 4'});

        await expect(siteOne).toBeVisible();
        await expect(siteTwo).toBeVisible();
        await expect(notVisible).not.toBeVisible();

        await siteOne.click();
        await siteTwo.click();

        await expect(page.getByText("Sector 1 vs Sector 2")).toBeVisible();
    });

    test("should create a graph - two graphs per site", async ({page}) => {
        // mock sites
        await page.route('**/api/site', async (route) => {
            await route.fulfill({
                json: {
                    sites: [
                        {id: 1, sampleName: "Station 1", geoLocName: "Sector 1", ph: 7.2, temperature: 22.6, collectionDate: new Date("2026-04-01")},
                        {id: 1, sampleName: "Station 1", geoLocName: "Sector 2", ph: 6.7, temperature: 27.6, collectionDate: new Date("2026-04-01")},
                    ]
                }
            });
        });

        await page.goto('/visualizations');

        await expect(page.getByText('No sites selected. Use the filter panel.')).toBeVisible();

        const dropDown = page.locator('aside select');
        await dropDown.selectOption('all');
        await expect(dropDown).toHaveValue('all');

        const metricWQI = page.locator('aside span:has-text("WQI")').first();
        await metricWQI.click();

        const search = page.getByPlaceholder('Search sites...');
        await search.fill('Sector');

        const siteOne = page.locator('aside button', {hasText: 'Sector 1',});
        const siteTwo = page.locator('aside button', {hasText: 'Sector 2',});
        const notVisible = page.locator('aside button', {hasText: 'Sector 4'});

        await expect(siteOne).toBeVisible();
        await expect(siteTwo).toBeVisible();
        await expect(notVisible).not.toBeVisible();

        await siteOne.click();

        await page.getByRole('button', {name: "Add New Visualization"}).click();
        await siteOne.click();
        await siteTwo.click();
    });
});
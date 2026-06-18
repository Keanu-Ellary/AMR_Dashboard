import {test, expect} from '@playwright/test';
import path from 'path';
import fs from 'fs';

test.describe('Home Page - Map Workspace', () => {
    test.beforeEach(async ({page}) => {
        await page.route('**/api/site', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                json: {
                    sites: [
                        {
                            id: 101,
                            sampleName: "ZA-PTA-01",
                            geoLocName: "Pretoria Central",
                            collectionDate: "2026-06-01T10:00:00.000Z",
                            latitude: -25.74650,
                            longitude: 28.20150,
                            ph: 7.3,
                            temperature: 19.5,
                            dissolveO2: 8.2,
                            tds: 150.0,
                            dangerZone: "green"
                        },
                        {
                            id: 102,
                            sampleName: "ZA-PTA-02",
                            geoLocName: "Arcadia Basin",
                            collectionDate: "2026-06-10T14:30:00.000Z",
                            latitude: -25.74520,
                            longitude: 28.19980,
                            ph: 6.4,
                            temperature: 24.5,
                            dissolveO2: 4.2,
                            tds: 240.0,
                            dangerZone: "red"
                        }
                    ]
                }
            });
        });
    });

    test('global state filtering, simple tabular views', async({page}) => {
        await page.goto('/');

        await expect(page.getByRole('heading', {name: 'Filter Panel'})).toBeVisible();

        await page.getByRole('button', {name: 'List by Geo Location'}).click();
        await expect(page.getByText('Pretoria Central')).toBeVisible();

        await page.getByRole('button', {name: 'List By Sample (All)'}).click();
        await expect(page.getByText('ZA-PTA-01')).toBeVisible();
        await expect(page.getByText('ZA-PTA-02')).toBeVisible();

        const startDate = page.locator('label:has-text("Start Date") + input[type="date"], input[type="date"]').first();
        const endDate = page.locator('label:has-text("End Date") + input[type="date"], input[type="date"]').last();

        await startDate.fill('2026-06-05');
        await endDate.fill('2026-06-15');

        await expect(page.getByText('ZA-PTA-02')).toBeVisible();
        await expect(page.getByText('ZA-PTA-01')).not.toBeVisible();

        const siteDown = page.getByRole('button', {name: "None"});
        await siteDown.click();

        const search = page.getByPlaceholder('Search sites...');
        await search.fill('Pretoria');

        const pretoriaCheck = page.locator('div').filter({hasText: /^Pretoria Central$/}).locator('div').first();
        await pretoriaCheck.click();

        await page.keyboard.press('Escape');

        const btnClearFilters = page.getByRole('button', {name: 'Clear All'});
        await expect(btnClearFilters).toBeVisible();
        await btnClearFilters.click();

        await expect(page.getByText('ZA-PTA-01')).toBeVisible();
        await expect(page.getByText('ZA-PTA-02')).toBeVisible();
    });

    test('site-specific visualizations when clicking on a site + export', async({page}) => {
        await page.goto('/');

        const mapTab = page.getByRole('button', {name: 'Interactive Spatial Mapping'});
        await expect(mapTab).toHaveClass(/bg-white/);

        const mapMarkers = page.locator('.leaflet-marker-icon, [role="button"] img, svg [class*="marker"]').first();

        await expect(mapMarkers).toBeVisible();

        await mapMarkers.hover();

        await mapMarkers.click();

        await page.goto('/statistics?site=101');

        await expect(page).toHaveURL('/statistics?site=101');

        await expect(page.getByText('Unknown - Samples & Geolocations')).toBeVisible();

        const btnExport = page.getByRole('button', {name: 'Export'});
        await expect(btnExport).toBeVisible();
        await btnExport.click();

        const download = page.waitForEvent('download');

        await page.getByRole('button', {name: 'Export as CSV'}).click();

        const performDownload = await download;

        const fileName = performDownload.suggestedFilename();
        expect(fileName).toMatch(/^site_.*\.csv$/i);

        const downloadPath = path.join(__dirname, fileName);
        await performDownload.saveAs(downloadPath);

        expect(fs.existsSync(downloadPath)).toBe(true);
        const contents = fs.readFileSync(downloadPath, 'utf8');
        expect(contents).toContain('Sample Name');
        expect(contents).toContain('Location');

        await expect(page.getByText('Statistics exported successfully')).toBeVisible();

        fs.unlinkSync(downloadPath);
    });
});
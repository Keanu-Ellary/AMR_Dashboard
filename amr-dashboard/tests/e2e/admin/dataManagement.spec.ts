import {test, expect} from '@playwright/test';
import fs from 'fs';
import path from 'path';

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

if (!email || !password)
{
    throw new Error("Missing E2E credentials");
}

test.describe('Data Management Page - Admin Only', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('/login');
        await page.getByPlaceholder("Email").fill(email);
        await page.getByPlaceholder("Password").fill(password);
        
        await page.getByRole("button", {name: "Login"}).click();
        
        await expect(page.getByText("Login successful!")).  toBeVisible();
        await expect(page).toHaveURL('/home');

        await page.goto('/data-management');
    });

    test('should create a single isolate sample', async ({page}) => {
        await page.getByRole('button', {name: 'Add Record'}).click();

        await page.getByPlaceholder('Apies River - Site A').fill("E2E Samples");
        await page.getByPlaceholder('Surface Water').fill('Reservoir Output');

        await page.locator('input[type="date"]').fill('2026-06-15');
        await page.getByPlaceholder('Site A', {exact: true}).fill('Gauteng Hydrology Sector 4');
        await page.getByPlaceholder('28.188').fill('28.2561');
        await page.getByPlaceholder('-25.744').fill('-25.8012');

        await page.getByPlaceholder('E. coli').fill('Salmonella enterica');
        await page.getByPlaceholder('AR-01').fill('SL-E2E-99');
        await page.locator('select').selectOption('Resistant (R)');
        await page.getByPlaceholder('qPCR').fill('Metagenomic Sequencing');
        await page.getByPlaceholder('blaCTX-M-15, sul1, tet(A)').fill("blaNDM-1, aph(3\')-Ia");

        await page.getByPlaceholder('7.0').fill('7.4');
        await page.getByPlaceholder('20.0').fill('22.5');
        await page.getByPlaceholder('8.0').fill('6.8');
        await page.getByPlaceholder('150').fill('185');
        await page.getByPlaceholder('250').fill('290');

        const btnSubmit = page.getByRole('button', {name: 'Submit Record'});
        await expect(btnSubmit).toBeEnabled();
        await btnSubmit.click();

        await expect(page.getByText('Site data added successfully')).toBeVisible();
    });

    test('should bulk upload from a CSV file', async ({page}) => {
        const csvPath = path.join(__dirname, 'mock_samples.csv');
        const content = 'sampleName,isolationSource,collectionDate,geoLocName,latitude,longitude,amrResGenes,predictedSir,sampleAnalysisType\n' +
        'Bulk Sample One,Riverbank,2026-06-01,Pretoria Basin,-25.74,28.20,tet(B),Resistant (R),PCR\n' +
        'Bulk Sample Two,Dam,2026-06-02,Pretoria Basin,-25.75,28.21,none,Susceptible (S),PCR';

        fs.writeFileSync(csvPath, content);

        const fileChooser = page.waitForEvent('filechooser');

        await page.getByRole('button', {name: 'Import File'}).click();
        await page.getByRole('button', {name: 'CSV (.csv)'}).click();

        const choose = await fileChooser;
        await choose.setFiles(csvPath);

        const modalHeading = page.getByRole('heading', {name: "Confirm Upload"});
        await expect(modalHeading).toBeVisible();

        const confirmModal = page.locator('div').filter({hasText: 'Confirm Upload'}).last();
        await expect(confirmModal).toContainText('mock_samples.csv');

        await confirmModal.getByRole('button', {name: 'Upload'}).click();

        await expect(page.getByText('Bulk data imported successfully!')).toBeVisible();

        fs.unlinkSync(csvPath);
    });

    test('should delete selected locations', async({page}) => {
        await expect(page.getByText('Loading Records...')).not.toBeVisible();

        const firstRow = page.locator('input[type="checkbox"]').last();
        await firstRow.check();

        await page.getByRole('button', {name: 'Delete', exact: true}).click();

        const btnDelete = page.getByRole('button', {name: /By Selected Locations/i});
        await expect(btnDelete).toBeEnabled();
        await btnDelete.click();

        const confirmDeleteModal = page.getByRole('button', {name: 'Delete Sites'});
        await expect(confirmDeleteModal).toBeVisible();

        await confirmDeleteModal.click();

        await expect(page.getByText('Successfully deleted 4 record(s)')).toBeVisible();
    });
});
import {test, expect} from '@playwright/test';

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

if (!email || !password)
{
    throw new Error("Missing E2E credentials");
}

test.describe('Change Management Page - Admin Only', () => {
    test.beforeEach(async ({page}) => {
        await page.goto('/login');
        await page.getByPlaceholder("Email").fill(email);
        await page.getByPlaceholder("Password").fill(password);
        
        await page.getByRole("button", {name: "Login"}).click();
        
        await expect(page.getByText("Login successful!")).  toBeVisible();
        await expect(page).toHaveURL('/home');

        await page.goto('/changelog');
    });

    // test('should filter, expand and undo changes', async ({page}) => {
    //     await expect(page.getByText('Loading Records...')).not.toBeVisible();

    //     const select = page.locator('select');
    //     await select.selectOption("BULK_DELETE");

    //     const deleteCard = page.locator('div.rounded-2xl').filter({hasText: 'BULK DELETE'}).filter({has: page.getByTitle('Undo Change')}).first();
    //     await expect(deleteCard).toBeVisible();

    //     const expand = deleteCard.locator('button').last();
    //     await expand.click();

    //     const heading = deleteCard.locator('h4');
    //     await expect(heading).toBeVisible();
    //     await expect(heading).toHaveText(/Deleted Water Samples \(1 records\)/i);

    //     const undo = deleteCard.getByTitle('Undo Change');
    //     await expect(undo).toBeEnabled();
    //     await undo.click();

    //     await expect(page.getByText('Change successfully undone!')).toBeVisible();
    // });
});
import {test, expect} from '@playwright/test';

const email = process.env.E2E_ADMIN_EMAIL;
const password = process.env.E2E_ADMIN_PASSWORD;

if (!email || !password)
{
    throw new Error("Missing E2E credentials");
}

test.describe('Authentication - Login', () => {
    test.use({storageState: {cookies: [], origins: []}});

    test("testing login", async ({page}) => {
        await page.goto("/login");

        await page.getByPlaceholder("Email").fill(email);
        await page.getByPlaceholder("Password").fill(password);

        await page.getByRole("button", {name: "Login"}).click();

        await expect(page.getByText("Login successful!")).  toBeVisible();
        await expect(page).toHaveURL('/home');
    });
});
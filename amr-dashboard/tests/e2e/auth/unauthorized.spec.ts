import {test, expect} from '@playwright/test';

test("testing login - not an admin", async ({page}) => {
    await page.goto("/login");

    await page.getByPlaceholder("Email").fill("email@unauth.com");
    await page.getByPlaceholder("Password").fill("password");

    await page.getByRole("button", {name: "Login"}).click();

    await expect(page.getByText("Login failed. Please try again.")).toBeVisible();
    await expect(page).toHaveURL('/login');
});
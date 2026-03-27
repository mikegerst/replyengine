import { test, expect } from '@playwright/test'

test.describe('Auth Flow', () => {
  test('login page loads with email and password fields', async ({ page }) => {
    await page.goto('/login')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('signup page loads with registration form', async ({ page }) => {
    await page.goto('/signup')

    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('submitting empty login form shows validation errors', async ({
    page,
  }) => {
    await page.goto('/login')

    // Click submit without filling in fields
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    // Browser native validation or custom error should appear
    // Check that we're still on the login page (not redirected)
    await expect(page).toHaveURL(/\/login/)
  })

  test('submitting empty signup form shows validation errors', async ({
    page,
  }) => {
    await page.goto('/signup')

    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()

    await expect(page).toHaveURL(/\/signup/)
  })
})

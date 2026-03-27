import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test('loads and shows the hero section', async ({ page }) => {
    await page.goto('/')

    // Hero section should be visible
    const hero = page.locator('text=Review').first()
    await expect(hero).toBeVisible()
  })

  test('pricing section displays all three plans', async ({ page }) => {
    await page.goto('/')

    // Scroll to pricing
    const pricing = page.locator('text=Pricing').first()
    await expect(pricing).toBeVisible()

    // All three plan names should be visible
    await expect(page.locator('text=Free')).toBeVisible()
    await expect(page.locator('text=Starter')).toBeVisible()
    await expect(page.locator('text=Pro')).toBeVisible()
  })

  test('free tool link navigates to /free', async ({ page }) => {
    await page.goto('/')

    const freeLink = page.locator('a[href="/free"]').first()
    if (await freeLink.isVisible()) {
      await freeLink.click()
      await expect(page).toHaveURL(/\/free/)
    }
  })

  test('signup CTA buttons are visible', async ({ page }) => {
    await page.goto('/')

    // Look for CTA buttons that link to signup
    const signupLinks = page.locator('a[href*="signup"], a[href*="sign-up"]')
    const count = await signupLinks.count()
    expect(count).toBeGreaterThan(0)
  })
})

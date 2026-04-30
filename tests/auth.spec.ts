import { test, expect } from '@playwright/test';

test('landing page has correct title and CTA', async ({ page }) => {
  await page.goto('/');

  // Wait for loading screen to disappear
  await expect(page.getByText(/Menyiapkan Pengalaman Belajar/i)).not.toBeVisible({ timeout: 15000 });

  // Check title
  await expect(page).toHaveTitle(/Future Bimbel Kedinasan/);

  // Check for CTA button (matches "Mulai Belajar Sekarang")
  const ctaButton = page.getByRole('button', { name: /Mulai Belajar Sekarang/i }).first();
  await expect(ctaButton).toBeVisible();
});

test('can open login modal', async ({ page }) => {
  await page.goto('/');

  // Wait for loading screen to disappear
  await expect(page.getByText(/Menyiapkan Pengalaman Belajar/i)).not.toBeVisible({ timeout: 15000 });

  // Click login/enter button (matches "MASUK SEKARANG")
  await page.getByRole('button', { name: /MASUK SEKARANG/i }).first().click();

  // Check if Auth Modal is visible
  await expect(page.getByText(/Selamat Datang Kembali/i)).toBeVisible();
});

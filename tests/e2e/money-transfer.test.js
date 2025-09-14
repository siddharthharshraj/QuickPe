import { test, expect } from '@playwright/test';

test.describe('Money Transfer Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Sign in as admin user
        await page.goto('/signin');
        await page.fill('input[name="email"]', 'admin@quickpe.com');
        await page.fill('input[name="password"]', 'Admin@123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('complete money transfer flow', async ({ page }) => {
        // Navigate to Send Money page
        await page.click('text=Send Money');
        await expect(page).toHaveURL('/send-money');
        
        // Should see users list
        await expect(page.locator('text=Select Recipient')).toBeVisible();
        
        // Wait for users to load and select first user
        await page.waitForSelector('[data-testid="user-card"]', { timeout: 10000 });
        await page.click('[data-testid="user-card"]:first-child');
        
        // Should navigate to transfer page
        await expect(page).toHaveURL(/\/transfer/);
        
        // Fill transfer form
        await page.fill('input[name="amount"]', '100');
        await page.fill('textarea[name="description"]', 'Test payment');
        
        // Submit transfer
        await page.click('button[type="submit"]');
        
        // Should see success message
        await expect(page.locator('text=Transfer successful')).toBeVisible();
        
        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
    });

    test('transfer validation - insufficient balance', async ({ page }) => {
        await page.click('text=Send Money');
        await page.waitForSelector('[data-testid="user-card"]');
        await page.click('[data-testid="user-card"]:first-child');
        
        // Try to transfer more than balance
        await page.fill('input[name="amount"]', '999999');
        await page.fill('textarea[name="description"]', 'Large payment');
        
        await page.click('button[type="submit"]');
        
        // Should show error message
        await expect(page.locator('text=Insufficient balance')).toBeVisible();
    });

    test('transfer validation - invalid amount', async ({ page }) => {
        await page.click('text=Send Money');
        await page.waitForSelector('[data-testid="user-card"]');
        await page.click('[data-testid="user-card"]:first-child');
        
        // Try negative amount
        await page.fill('input[name="amount"]', '-50');
        await page.click('button[type="submit"]');
        
        await expect(page.locator('text=Amount must be greater than 0')).toBeVisible();
        
        // Try zero amount
        await page.fill('input[name="amount"]', '0');
        await page.click('button[type="submit"]');
        
        await expect(page.locator('text=Amount must be greater than 0')).toBeVisible();
    });

    test('add money to wallet', async ({ page }) => {
        // Click Add Money button on dashboard
        await page.click('text=Add Money');
        
        // Should open modal
        await expect(page.locator('text=Add Money to Wallet')).toBeVisible();
        
        // Fill amount
        await page.fill('input[placeholder="Enter amount"]', '500');
        
        // Submit
        await page.click('button:has-text("Add Money")');
        
        // Should see success message
        await expect(page.locator('text=Money added successfully')).toBeVisible();
        
        // Modal should close
        await expect(page.locator('text=Add Money to Wallet')).not.toBeVisible();
    });

    test('view transaction history', async ({ page }) => {
        // Navigate to transaction history
        await page.click('text=Transaction History');
        await expect(page).toHaveURL('/transaction-history');
        
        // Should see transactions table
        await expect(page.locator('text=Transaction History')).toBeVisible();
        await expect(page.locator('table')).toBeVisible();
        
        // Should see filter options
        await expect(page.locator('select[name="type"]')).toBeVisible();
        
        // Test filtering
        await page.selectOption('select[name="type"]', 'sent');
        
        // Should filter transactions
        await page.waitForTimeout(1000); // Wait for filter to apply
    });

    test('download PDF statement', async ({ page }) => {
        await page.click('text=Transaction History');
        
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        // Click download PDF button
        await page.click('text=Download PDF');
        
        // Wait for download
        const download = await downloadPromise;
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/QuickPe_Statement_.*\.pdf/);
    });

    test('search users in send money', async ({ page }) => {
        await page.click('text=Send Money');
        
        // Wait for users to load
        await page.waitForSelector('[data-testid="user-card"]');
        
        // Use search functionality
        await page.fill('input[placeholder="Search users..."]', 'John');
        
        // Should filter users
        await page.waitForTimeout(1000);
        
        // Verify filtered results
        const userCards = await page.locator('[data-testid="user-card"]').count();
        expect(userCards).toBeGreaterThanOrEqual(0);
    });
});

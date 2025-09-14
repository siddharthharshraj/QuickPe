import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Sign in as admin user
        await page.goto('/signin');
        await page.fill('input[name="email"]', 'admin@quickpe.com');
        await page.fill('input[name="password"]', 'Admin@123');
        await page.click('button[type="submit"]');
        await expect(page).toHaveURL('/dashboard');
    });

    test('access admin dashboard', async ({ page }) => {
        // Navigate to admin dashboard
        await page.goto('/admin');
        
        // Should see admin dashboard
        await expect(page.locator('text=Admin Dashboard')).toBeVisible();
        await expect(page.locator('text=User Management')).toBeVisible();
        await expect(page.locator('text=System Statistics')).toBeVisible();
    });

    test('view and manage users', async ({ page }) => {
        await page.goto('/admin');
        
        // Should see users table
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('text=Name')).toBeVisible();
        await expect(page.locator('text=Email')).toBeVisible();
        await expect(page.locator('text=Status')).toBeVisible();
        
        // Test user search
        await page.fill('input[placeholder="Search users..."]', 'admin');
        await page.waitForTimeout(1000);
        
        // Should filter results
        const rows = await page.locator('tbody tr').count();
        expect(rows).toBeGreaterThanOrEqual(1);
    });

    test('create new user', async ({ page }) => {
        await page.goto('/admin');
        
        // Click Add User button
        await page.click('text=Add User');
        
        // Should open modal
        await expect(page.locator('text=Add New User')).toBeVisible();
        
        // Fill form
        await page.fill('input[name="firstName"]', 'Test');
        await page.fill('input[name="lastName"]', 'User');
        await page.fill('input[name="email"]', `testuser${Date.now()}@example.com`);
        await page.fill('input[name="phone"]', '9876543210');
        await page.fill('input[name="password"]', 'password123');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Should see success message
        await expect(page.locator('text=User created successfully')).toBeVisible();
        
        // Modal should close
        await expect(page.locator('text=Add New User')).not.toBeVisible();
    });

    test('edit user information', async ({ page }) => {
        await page.goto('/admin');
        
        // Click edit button for first user (not admin)
        await page.click('[data-testid="edit-user"]:not([data-admin="true"]):first-child');
        
        // Should open edit modal
        await expect(page.locator('text=Edit User')).toBeVisible();
        
        // Update information
        await page.fill('input[name="firstName"]', 'Updated');
        
        // Submit
        await page.click('button[type="submit"]');
        
        // Should see success message
        await expect(page.locator('text=User updated successfully')).toBeVisible();
    });

    test('toggle user status', async ({ page }) => {
        await page.goto('/admin');
        
        // Click status toggle for first non-admin user
        await page.click('[data-testid="toggle-status"]:not([data-admin="true"]):first-child');
        
        // Should see confirmation or success message
        await expect(page.locator('text=Status updated')).toBeVisible();
    });

    test('view system statistics', async ({ page }) => {
        await page.goto('/admin');
        
        // Should see stats cards
        await expect(page.locator('text=Total Users')).toBeVisible();
        await expect(page.locator('text=Total Transactions')).toBeVisible();
        await expect(page.locator('text=Total Amount')).toBeVisible();
        await expect(page.locator('text=Active Users')).toBeVisible();
        
        // Stats should have numeric values
        const userCount = await page.locator('[data-testid="total-users"]').textContent();
        expect(parseInt(userCount)).toBeGreaterThanOrEqual(0);
    });

    test('export users as CSV', async ({ page }) => {
        await page.goto('/admin');
        
        // Set up download listener
        const downloadPromise = page.waitForEvent('download');
        
        // Click export button
        await page.click('text=Export CSV');
        
        // Wait for download
        const download = await downloadPromise;
        
        // Verify download
        expect(download.suggestedFilename()).toMatch(/users_export_.*\.csv/);
    });

    test('view recent transactions', async ({ page }) => {
        await page.goto('/admin');
        
        // Should see recent transactions section
        await expect(page.locator('text=Recent Transactions')).toBeVisible();
        
        // Should see transaction table or empty state
        const hasTransactions = await page.locator('table tbody tr').count();
        if (hasTransactions > 0) {
            await expect(page.locator('text=Amount')).toBeVisible();
            await expect(page.locator('text=Status')).toBeVisible();
        } else {
            await expect(page.locator('text=No recent transactions')).toBeVisible();
        }
    });

    test('pagination in user list', async ({ page }) => {
        await page.goto('/admin');
        
        // Check if pagination exists (depends on number of users)
        const paginationExists = await page.locator('[data-testid="pagination"]').isVisible();
        
        if (paginationExists) {
            // Test pagination
            await page.click('[data-testid="next-page"]');
            await page.waitForTimeout(1000);
            
            // Should update page
            const currentPage = await page.locator('[data-testid="current-page"]').textContent();
            expect(parseInt(currentPage)).toBeGreaterThan(1);
        }
    });

    test('non-admin user cannot access admin dashboard', async ({ page }) => {
        // Sign out first
        await page.click('[data-testid="user-dropdown"]');
        await page.click('text=Logout');
        
        // Sign in as regular user (if exists)
        await page.goto('/signin');
        await page.fill('input[name="email"]', 'user@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.click('button[type="submit"]');
        
        // Try to access admin dashboard
        await page.goto('/admin');
        
        // Should be redirected or show access denied
        await expect(page.locator('text=Access Denied')).toBeVisible().catch(() => {
            // Or should redirect to dashboard/signin
            expect(page.url()).not.toContain('/admin');
        });
    });
});

import { test, expect } from '@playwright/test';

test.describe('User Authentication Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the landing page
        await page.goto('/');
    });

    test('complete user signup flow', async ({ page }) => {
        // Click Get Started button
        await page.click('text=Get Started');
        
        // Should navigate to signup page
        await expect(page).toHaveURL('/signup');
        
        // Fill signup form
        await page.fill('input[name="firstName"]', 'John');
        await page.fill('input[name="lastName"]', 'Doe');
        await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
        await page.fill('input[name="phone"]', '1234567890');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="confirmPassword"]', 'password123');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Should redirect to dashboard after successful signup
        await expect(page).toHaveURL('/dashboard');
        
        // Should see welcome message
        await expect(page.locator('text=Welcome, John!')).toBeVisible();
        
        // Should see balance section
        await expect(page.locator('text=Current Balance')).toBeVisible();
    });

    test('signin with valid credentials', async ({ page }) => {
        // First create a user account (assuming one exists)
        await page.click('text=Sign In');
        await expect(page).toHaveURL('/signin');
        
        // Fill signin form
        await page.fill('input[name="email"]', 'admin@quickpe.com');
        await page.fill('input[name="password"]', 'Admin@123');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Should redirect to dashboard
        await expect(page).toHaveURL('/dashboard');
        
        // Should see user navigation
        await expect(page.locator('text=Dashboard')).toBeVisible();
        await expect(page.locator('text=Send Money')).toBeVisible();
    });

    test('signin with invalid credentials', async ({ page }) => {
        await page.click('text=Sign In');
        
        // Fill with invalid credentials
        await page.fill('input[name="email"]', 'invalid@example.com');
        await page.fill('input[name="password"]', 'wrongpassword');
        
        // Submit form
        await page.click('button[type="submit"]');
        
        // Should show error message
        await expect(page.locator('text=Invalid credentials')).toBeVisible();
        
        // Should stay on signin page
        await expect(page).toHaveURL('/signin');
    });

    test('logout functionality', async ({ page }) => {
        // First sign in
        await page.click('text=Sign In');
        await page.fill('input[name="email"]', 'admin@quickpe.com');
        await page.fill('input[name="password"]', 'Admin@123');
        await page.click('button[type="submit"]');
        
        // Wait for dashboard to load
        await expect(page).toHaveURL('/dashboard');
        
        // Click on user dropdown
        await page.click('[data-testid="user-dropdown"]');
        
        // Click logout
        await page.click('text=Logout');
        
        // Should redirect to landing page
        await expect(page).toHaveURL('/');
        
        // Should see sign in button again
        await expect(page.locator('text=Sign In')).toBeVisible();
    });

    test('protected route access without authentication', async ({ page }) => {
        // Try to access dashboard directly
        await page.goto('/dashboard');
        
        // Should redirect to signin page
        await expect(page).toHaveURL('/signin');
        
        // Should see signin form
        await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('form validation on signup', async ({ page }) => {
        await page.click('text=Get Started');
        
        // Try to submit empty form
        await page.click('button[type="submit"]');
        
        // Should show validation errors
        await expect(page.locator('text=First name is required')).toBeVisible();
        await expect(page.locator('text=Email is required')).toBeVisible();
        
        // Fill invalid email
        await page.fill('input[name="email"]', 'invalid-email');
        await page.click('button[type="submit"]');
        
        // Should show email validation error
        await expect(page.locator('text=Please enter a valid email')).toBeVisible();
        
        // Fill mismatched passwords
        await page.fill('input[name="firstName"]', 'John');
        await page.fill('input[name="email"]', 'john@example.com');
        await page.fill('input[name="password"]', 'password123');
        await page.fill('input[name="confirmPassword"]', 'different');
        await page.click('button[type="submit"]');
        
        // Should show password mismatch error
        await expect(page.locator('text=Passwords do not match')).toBeVisible();
    });
});

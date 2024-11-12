import { expect, request, test } from '@playwright/test';

test.use({
  screenshot: 'only-on-failure',
  trace: 'retain-on-failure',
  video: 'retain-on-failure',
});

const apiUrl = (url: string) => `http://localhost:3000${url}`;

const testUser = {
  accountStatus: 'active',
  username: 'testuser',
  password: 'testpassword',
};

test.describe('Profile Screen', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login via API to get auth token
    const loginResponse = await request.post(apiUrl('/auth/login'), {
      data: testUser,
    });

    expect(loginResponse.ok()).toBeTruthy();
    const session = await loginResponse.json();
    authToken = session.token;
  });

  test.beforeEach(async ({ page, request }) => {
    // Login via UI
    try {
      await page.goto('/login');
      await page.getByPlaceholder('Username').fill(testUser.username);
      await page.getByPlaceholder('Password').fill(testUser.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL('/posts');
      await page.goto('/profile');
      await expect(page).toHaveURL('/profile');
    } catch (error) {
      await page.screenshot({
        path: `./test-results/login-failure-${Date.now()}.png`,
        fullPage: true,
      });
      throw error;
    }
  });

  test('displays correct profile layout and elements', async ({ page, request }) => {
    try {


    const userProfileResponse = await request.get(apiUrl(`/users/1`), {
      headers: {
        // @ts-ignore
        Authorization: authToken,
      },
    });

    expect(userProfileResponse.ok()).toBeTruthy();
    const userProfile = await userProfileResponse.json();

    const {id, username, favoriteBook } = userProfile;

    // Check main profile elements
      await expect(page.getByRole('heading', { name: username })).toBeVisible();
      await expect(page.getByText(username)).toBeVisible();

      await expect(page.getByTestId('user-id')).toBeVisible();
      await expect(page.getByText(id)).toBeVisible();

      await expect(page.getByTestId('account-status')).toBeVisible();
      await expect(page.getByText(testUser.accountStatus)).toBeVisible();

      await expect(page.getByTestId('favorite-book')).toBeVisible();
      await expect(page.getByText(`${favoriteBook.title} by ${favoriteBook.author_name[0]}`)).toBeVisible();

      // Check navigation elements
      await expect(page.getByRole('link', { name: 'Posts' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Profile' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Logout' })).toBeVisible();
    } catch (error) {
      await page.screenshot({
        path: `./test-results/profile-layout-failure-${Date.now()}.png`,
        fullPage: true,
      });
      throw error;
    }
  });

  test('allow to logout', async ({ page }) => {
    await page.getByRole('button', { name: 'Logout' }).click();
    await expect(page).toHaveURL('/login');
  });

  test('allow edit favorite book', async ({ page }) => {
    test.setTimeout(1000 * 15); // this for search time
    try {
        // set timeout to 15 seconds
        await expect(page.getByTestId('edit-favorite-book')).toBeVisible();
        await page.getByTestId('edit-favorite-book').click();
        
        // input with placeholder "search for a book"
        await page.getByPlaceholder('search for a book').fill('The Great Gatsby');
        
        // element with text "The Great Gatsby"
        await expect(page.getByText('The Great Gatsby').first()).toBeVisible();

        // click on the element with text "The Great Gatsby"
        await page.getByText('The Great Gatsby').first().click();
        // this should be inside a span or another html element
        await expect(page.getByText('The Great Gatsby')).toBeVisible(); 

    } catch (error) {
      await page.screenshot({
        path: `./test-results/password-change-failure-${Date.now()}.png`,
        fullPage: true,
      });
      throw error;
    }
  });

  test('navigation works correctly', async ({ page }) => {
    try {
      // Test posts navigation
      await page.getByRole('link', { name: 'Posts' }).click();
      await expect(page).toHaveURL('/posts');

      // Return to profile
      await page.getByRole('link', { name: 'Profile' }).click();
      await expect(page).toHaveURL('/profile');

      // Test logout
      await page.getByRole('button', { name: 'Logout' }).click();
      await expect(page).toHaveURL('/login');
    } catch (error) {
      await page.screenshot({
        path: `./test-results/profile-navigation-failure-${Date.now()}.png`,
        fullPage: true,
      });
      throw error;
    }
  });

  test.afterAll(async ({ request }) => {
    try {
      // Logout to cleanup session
      await request.post(apiUrl('/auth/logout'), {
        headers: {
          Authorization: authToken,
        },
      });
    } catch (error) {
      console.error('Failed to logout after tests:', error);
    }
  });
}); 
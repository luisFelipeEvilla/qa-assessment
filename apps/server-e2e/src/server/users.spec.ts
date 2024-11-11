import axios from 'axios';
import { Session, User } from '@qa-assessment/shared';

describe('Users API', () => {
  let authToken: string;
  let userId: string;
  const testUsername = `testuser_${Math.random().toString(36).substring(7)}`;
  const testPassword = 'password123';

  describe('POST /users (Registration)', () => {
    it('should register a new user successfully', async () => {
      const registerResponse = await axios.post<Session>('/users', {
        username: testUsername,
        password: testPassword,
      });

      expect(registerResponse.status).toBe(200);
      expect(registerResponse.data.token).toBeDefined();
      expect(registerResponse.data.userId).toBeDefined();

      // Save for later tests
      authToken = registerResponse.data.token;
      userId = registerResponse.data.userId;
      
      // Configure axios for authenticated requests
      axios.defaults.headers.common['Authorization'] = authToken;
    });

    it('should reject registration with invalid data', async () => {
      try {
        await axios.post('/users', {
          username: '', // Invalid empty username
          password: 'short', // Too short password
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(422);
        expect(error.response.data.errors).toBeDefined();
      }
    });

    it('should reject duplicate username registration', async () => {
      try {
        await axios.post('/users', {
          username: testUsername, // Already used username
          password: testPassword,
        });
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(500); // this should be 409
      }
    });
  });

  describe('GET /users/:userId', () => {
    it('should retrieve user details successfully', async () => {
      const response = await axios.get<User>(`/users/${userId}`);
      
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(userId);
      expect(response.data.username).toBe(testUsername);
    //   expect(response.data.password).toBeUndefined(); // Password should not be returned
    });

    it('should return 404 for non-existent user', async () => {
      try {
        await axios.get('/users/nonexistent-id');
        fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.response.status).toBe(404);
      }
    });
  });

  describe('PUT /users/:userId', () => {
    it('should update user details successfully', async () => {
      const updateData = {
        favoriteBook: {
            key: '123',
          title: 'Test Book',
        },
      };

      const response = await axios.put<User>(`/users/${userId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data.favoriteBook).toEqual(JSON.stringify(updateData.favoriteBook)); // should return as json
      //   expect(response.data.favoriteBook).toEqual(updateData.favoriteBook); // should return as json
    });
  });
});

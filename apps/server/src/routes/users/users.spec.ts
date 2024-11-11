import request from 'supertest';
import { sessionRepository, userRepository } from '../../database';
import bcrypt from 'bcrypt';
import { makeExpressApp } from '../../lib';
import { mockUser, mockSession, mockBook } from '../../mock/user.mock';
import { json } from 'body-parser';

describe('Users', () => {
  const app = makeExpressApp();

  beforeEach(() => {
    // Mock repository methods
    jest.spyOn(userRepository, 'find').mockResolvedValue(mockUser);
    jest.spyOn(userRepository, 'update').mockResolvedValue(mockUser);
    jest.spyOn(userRepository, 'register').mockResolvedValue(mockUser);
    jest.spyOn(sessionRepository, 'create').mockResolvedValue(mockSession);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(JSON, 'parse').mockRestore();
  });

  describe('GET /users/:userId', () => {
    it('should return user details successfully', async () => {
      jest.spyOn(JSON, 'parse')

      const response = await request(app).get(`/users/${mockUser.id}`);

      expect(response.status).toBe(200);

      // should parse book string to object
      expect(JSON.parse).toHaveBeenCalledWith(mockUser.favoriteBook);
      expect(JSON.parse).toHaveBeenCalledTimes(2); // parse book data and parse response

      expect(response.body).toEqual({
        ...mockUser,
        favoriteBook: mockBook,
      });
      expect(userRepository.find).toHaveBeenCalled();
      expect(userRepository.find).toHaveBeenCalledTimes(1);
      expect(userRepository.find).toHaveBeenCalledWith(mockUser.id);
    });

    it('should handle non-existent user', async () => {
      jest
        .spyOn(userRepository, 'find')
        .mockRejectedValue(new Error('Not found'));

      const response = await request(app).get('/users/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'User not found' });
    });
  });

  describe('PUT /users/:userId', () => {
    const updateData = {
      ...mockUser,
      username: 'updateduser',
      favoriteBook: mockBook,
    };

    it('should update user successfully only with user basic data', async () => {
      const response = await request(app)
        .put(`/users/${mockUser.id}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(userRepository.update).toHaveBeenCalledWith(mockUser.id, {
        ...mockUser,
        username: 'updateduser',
        favoriteBook: JSON.stringify(mockBook),
      });
    });

    // it('should handle non-existent user', async () => {
    //   jest.spyOn(userRepository, 'find').mockResolvedValue(undefined);

    //   const response = await request(app)
    //     .put(`/users/nonexistent`)
    //     .send(updateData);

    //   expect(response.status).toBe(404);
    //   expect(response.body).toEqual({ message: 'User not found' });
    // });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/users/${mockUser.id}`)
        .send({ username: 'a' }); // username too short

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /users', () => {
    const registerData = {
      username: 'newuser',
      password: 'password123',
    };

    it('should register user successfully', async () => {
      const response = await request(app).post('/users').send(registerData);

      expect(response.status).toBe(200);
      expect(userRepository.register).toHaveBeenCalledWith(registerData);
      expect(sessionRepository.create).toHaveBeenCalledWith(mockUser);
    });

    it('should validate registration data', async () => {
      const response = await request(app).post('/users').send({
        username: 'a', // too short
        password: '123', // too short
      });

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('errors');
    });
  });
});

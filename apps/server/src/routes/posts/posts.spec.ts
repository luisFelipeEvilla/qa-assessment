import request from 'supertest';
import express from 'express';
import { postRepository } from '../../database';
import { postsRoutes } from './posts';
import { getSession } from '../../lib';
import {
  mockCreatedPost,
  mockNewPost,
  mockPost,
  mockPosts,
} from '../../mock/posts.mock';

// Mock dependencies
jest.mock('../../database');
jest.mock('../../lib', () => ({
  ...jest.requireActual('../../lib'),
  getSession: jest.fn(),
  authMiddleware: () => (_req: any, _res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/posts', postsRoutes);

describe('Posts Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /posts', () => {
    it('should return all posts', async () => {
      (postRepository.all as jest.Mock).mockResolvedValue(mockPosts);

      const response = await request(app).get('/posts');

      expect(postRepository.all).toHaveBeenCalled();
      expect(postRepository.all).toHaveBeenCalledTimes(1);
      expect(postRepository.all).toHaveBeenCalledWith();
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPosts);
    });
  });

  describe('GET /posts/:postId', () => {
    it('should return a specific post', async () => {
      (postRepository.find as jest.Mock).mockResolvedValue(mockPost);

      const response = await request(app).get('/posts/1');

      expect(response.status).toBe(200);
      expect(postRepository.find).toHaveBeenCalled();
      expect(postRepository.find).toHaveBeenCalledTimes(1);
      expect(postRepository.find).toHaveBeenCalledWith('1');
      expect(response.body).toEqual(mockPost);
    });

    it('should return 404 if post not found', async () => {
      (postRepository.find as jest.Mock).mockRejectedValue(new Error('Not found'));

      const response = await request(app).get('/posts/999');

      expect(response.status).toBe(404);
      expect(postRepository.find).toHaveBeenCalled();
      expect(postRepository.find).toHaveBeenCalledTimes(1);
      expect(postRepository.find).toHaveBeenCalledWith('999');
      expect(response.body).toEqual({ message: 'Post not found' });
    });
  });

  describe('POST /posts', () => {
    it('should create a new post', async () => {
      const mockSession = { userId: 'user1' };
      (getSession as jest.Mock).mockResolvedValue(mockSession);
      
      (postRepository.create as jest.Mock).mockResolvedValue(mockCreatedPost);

      const response = await request(app)
        .post('/posts')
        .send(mockNewPost);

      expect(response.status).toBe(201);
      expect(postRepository.create).toHaveBeenCalled();
      expect(postRepository.create).toHaveBeenCalledTimes(1);
      expect(postRepository.create).toHaveBeenCalledWith({
        ...mockNewPost,
        authorId: mockSession.userId,
      });
      expect(response.body).toEqual(mockCreatedPost);
    });

    it('should return 422 for invalid post data', async () => {
      const response = await request(app)
        .post('/posts')
        .send({ invalid: 'data' });

      expect(response.status).toBe(422);
      expect(postRepository.create).not.toHaveBeenCalled();
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('PUT /posts/:postId', () => {
    it('should update an existing post', async () => {
      const updates = { title: 'New Title' };
      const updatedPost = { ...mockPost, ...updates };

      (postRepository.find as jest.Mock).mockResolvedValue(mockPost);
      (postRepository.update as jest.Mock).mockResolvedValue(updatedPost);

      const response = await request(app)
        .put('/posts/1')
        .send(updates);

      expect(response.status).toBe(200);

      // should find the post
      expect(postRepository.find).toHaveBeenCalled();
      expect(postRepository.find).toHaveBeenCalledTimes(1);
      expect(postRepository.find).toHaveBeenCalledWith('1');

      // should update the post
      expect(postRepository.update).toHaveBeenCalled();
      expect(postRepository.update).toHaveBeenCalledTimes(1);
      expect(postRepository.update).toHaveBeenCalledWith('1', {
        ...mockPost,
        ...updates,
      });

      // should return the updated post
      expect(response.body).toEqual(updatedPost);
    });

    it('should return 404 if post not found', async () => {
      (postRepository.find as jest.Mock).mockRejectedValue(new Error('Not found'));

      const response = await request(app)
        .put('/posts/999')
        .send({ title: 'New Title' });

      expect(response.status).toBe(404);

      // should not update the post
      expect(postRepository.update).not.toHaveBeenCalled();

      expect(response.body).toEqual({ message: 'Post not found' });
    });
  });

  describe('DELETE /posts/:postId', () => {
    it('should delete a post', async () => {
      (postRepository.delete as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/posts/1');

      expect(response.status).toBe(200);

      // should delete the post
      expect(postRepository.delete).toHaveBeenCalled();
      expect(postRepository.delete).toHaveBeenCalledTimes(1);
      expect(postRepository.delete).toHaveBeenCalledWith('1');

      expect(response.body).toEqual({ message: 'Post deleted' });
    });

    it('should return 404 if post not found', async () => {
      (postRepository.delete as jest.Mock).mockRejectedValue(new Error('Not found'));

      const response = await request(app).delete('/posts/999');

      expect(response.status).toBe(404);

      // should not delete the post
      expect(postRepository.delete).toHaveBeenCalled();
      expect(postRepository.delete).toHaveBeenCalledTimes(1);
      expect(postRepository.delete).toHaveBeenCalledWith('999');

      expect(response.body).toEqual({ message: 'Post not found' });
    });
  });
}); 
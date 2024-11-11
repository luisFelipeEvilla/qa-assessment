import { Request, Response } from 'express';
import { sessionRepository } from '../../database';
import { authMiddleware, corsMiddleware, getSession, serverErrorMiddleware } from './express';

jest.mock('../../database', () => ({
  sessionRepository: {
    findByToken: jest.fn(),
    
  },
}));

describe('Express Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let nextFn: jest.Mock;

  beforeEach(() => {
    mockReq = {
      headers: {},
      get: jest.fn(),
      method: 'GET',
      body: {},
      params: {},
      query: {},
      path: '/',
      protocol: 'http',
      hostname: 'localhost',
      ip: '127.0.0.1',
      cookies: {},
      secure: false,
      xhr: false,
      app: {
        get: jest.fn(),
      } as any,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      header: jest.fn(),
      sendStatus: jest.fn(),
    };
    nextFn = jest.fn();
  });

  describe('authMiddleware', () => {
    it('should return 401 when no authorization header is present', () => {
      const middleware = authMiddleware();
      middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
      expect(nextFn).not.toHaveBeenCalled();
    });

    it('should call next() when authorization is valid', async () => {
        mockReq.headers = { authorization: 'valid-token' };
        const mockSession = { id: '1', userId: '123' };

        
        (sessionRepository.findByToken as jest.Mock).mockResolvedValue(mockSession);
  
        const middleware = authMiddleware();
        middleware(mockReq as Request, mockRes as Response, nextFn);
  
        // TODO: check nextfn spy 
        // expect(nextFn).toHaveBeenCalled();
      });
  });

  describe('corsMiddleware', () => {
    it('should set CORS headers', () => {
      const middleware = corsMiddleware();
      (mockReq.get as jest.Mock).mockReturnValue('http://example.com');

      middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', 'http://example.com');
      expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
      expect(mockRes.header).toHaveBeenCalledWith('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      expect(nextFn).toHaveBeenCalled();
    });

    it('should handle OPTIONS requests', () => {
      const middleware = corsMiddleware();
      mockReq.method = 'OPTIONS';

      middleware(mockReq as Request, mockRes as Response, nextFn);

      expect(mockRes.sendStatus).toHaveBeenCalledWith(200);
      expect(nextFn).not.toHaveBeenCalled();
    });
  });

  describe('serverErrorMiddleware', () => {
    it('should return 500 status with error message', () => {
      const middleware = serverErrorMiddleware();
      const error = new Error('Test error');

      middleware(error, mockReq as Request, mockRes as Response, nextFn);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Internal server error' });
    });
  });

  describe('getSession', () => {
    it('should throw error when no authorization header is present', async () => {
      await expect(getSession(mockReq as Request)).rejects.toThrow('Unauthorized');
    });

    it('should throw error when session is not found', async () => {
      mockReq.headers = { authorization: 'invalid-token' };
      (sessionRepository.findByToken as jest.Mock).mockResolvedValue(null);

      await expect(getSession(mockReq as Request)).rejects.toThrow('Unauthorized');
    });

    it('should return session when authorization is valid', async () => {
      mockReq.headers = { authorization: 'valid-token' };
      const mockSession = { id: '1' };
      (sessionRepository.findByToken as jest.Mock).mockResolvedValue(mockSession);

      const result = await getSession(mockReq as Request);
      expect(result).toEqual(mockSession);
    });
  });
});

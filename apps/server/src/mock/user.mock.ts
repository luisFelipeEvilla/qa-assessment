import bcrypt from 'bcrypt';

const currentDate = new Date();

export const mockUser = {
  id: '1',
  username: 'testuser',
  password: bcrypt.hashSync('password123', 10),
};

export const mockSession = {
  id: '1',
  userId: mockUser.id,
  token: 'test-session-token',
  createdAt: currentDate,
};

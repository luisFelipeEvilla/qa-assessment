import bcrypt from 'bcrypt';

const currentDate = new Date();

export const mockBook = {
  key: '1',
  title: 'New Book',
  author_name: ['Author'],
  first_publish_year: 2024,
};

export const mockUser = {
  id: '1',
  username: 'testuser',
  password: bcrypt.hashSync('password123', 10),
  favoriteBook: JSON.stringify(mockBook),
};

export const mockSession = {
  id: '1',
  userId: mockUser.id,
  token: 'test-session-token',
  createdAt: currentDate,
};

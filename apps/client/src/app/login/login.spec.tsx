import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useStorage, useFetch } from '../../hooks';
import { useNavigate } from 'react-router-dom';
import Login from './login';
import { describe, expect, it, vi } from 'vitest';
import { Mock } from '@vitest/spy';
import '@testing-library/jest-dom';

// Mock the hooks
vi.mock('../../hooks', () => ({
  useStorage: vi.fn(),
  useFetch: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

describe('Login Component', () => {
  const mockNavigate = vi.fn();
  const mockStorage = {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  };
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    (useNavigate as Mock).mockReturnValue(mockNavigate);
    (useStorage as Mock).mockReturnValue(mockStorage);
    (useFetch as Mock).mockReturnValue({
      fetch: mockFetch,
      isLoading: false,
      error: null,
    });
  });

  it('should render login form', () => {
    render(<Login />);
    
    expect(screen.getByPlaceholderText('Username')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    render(<Login />);
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    
    await waitFor(() => {
      expect(screen.getByText('String must contain at least 3 character(s)')).toBeInTheDocument();
      expect(screen.getByText('String must contain at least 8 character(s)')).toBeInTheDocument();
    });
  });

  it('should handle successful login', async () => {
    const mockSession = { token: 'test-token', userId: '123' };

    const { set } = useStorage();
    const navigate = useNavigate();
    
    (useFetch as Mock).mockReturnValue({
        fetch: vi.fn(() => {
            set('session', JSON.stringify(mockSession));
            navigate('/posts');
            return Promise.resolve(mockSession);
        }),
        isLoading: false,
        error: null,
    });

    render(<Login />);
    
    fireEvent.change(screen.getByPlaceholderText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'testpassword' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockStorage.set).toHaveBeenCalledWith(
        'session',
        JSON.stringify(mockSession)
      );
      expect(mockNavigate).toHaveBeenCalledWith('/posts');
    });
  });

  it('should display error message on failed login', async () => {
    (useFetch as Mock).mockReturnValue({
      fetch: mockFetch,
      isLoading: false,
      error: new Error('Invalid credentials'),
    });

    render(<Login />);
    
    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});

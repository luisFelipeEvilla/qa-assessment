import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PostsPage from './posts';
import { useApiFetch } from '../../hooks';
import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Mock the custom hook
vi.mock('../../hooks', () => ({
  useApiFetch: vi.fn(),
}));

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPosts = [
  {
    id: '1',
    title: 'Test Post',
    content: 'Test Content',
    authorId: 'user1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
];

const mockUsers = {
  user1: {
    id: 'user1',
    username: 'testuser',
    favoriteBook: {
      title: 'Test Book',
      author_name: ['Test Author'],
    },
  },
};

describe('PostsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mock implementation
    (useApiFetch as jest.Mock).mockImplementation(() => ({
      get: vi.fn().mockResolvedValue(mockPosts),
      delete: vi.fn().mockResolvedValue({}),
      data: mockPosts,
      error: null,
      isLoading: false,
    }));
  });

  it('renders posts successfully', async () => {
    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Post')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  it('handles loading state', () => {
    (useApiFetch as jest.Mock).mockImplementation(() => ({
      get: vi.fn(),
      data: null,
      error: null,
      isLoading: true,
    }));

    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading posts...')).toBeInTheDocument();
  });

  it('handles error state', async () => {
    (useApiFetch as jest.Mock).mockImplementation(() => ({
      get: vi.fn(),
      data: null,
      error: new Error('Failed to fetch'),
      isLoading: false,
    }));

    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>
    );

    expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
  });

  // it('navigates to create post page', () => {
  //   render(
  //     <BrowserRouter>
  //       <PostsPage />
  //     </BrowserRouter>
  //   );

  //   fireEvent.click(screen.getByText('Create Post'));
  //   // expect(mockNavigate).toHaveBeenCalledWith('/posts/new');
  // });

//   it('handles post deletion', async () => {
//     const mockDelete = vi.fn().mockResolvedValue({});
//     const mockGetPosts = vi.fn().mockResolvedValue(mockPosts);
    
//     (useApiFetch as jest.Mock).mockImplementation(() => ({
//       get: mockGetPosts,
//       delete: mockDelete,
//       data: mockPosts,
//       error: null,
//       isLoading: false,
//     }));

//     // Mock window.confirm
//     const mockConfirm = vi.spyOn(window, 'confirm');
//     mockConfirm.mockImplementation(() => true);

//     render(
//       <BrowserRouter>
//         <PostsPage />
//       </BrowserRouter>
//     );

//     await waitFor(() => {
//       const deleteButton = screen.getByTestId('delete-button');
//       fireEvent.click(deleteButton);

        
//     });

//     expect(mockConfirm).toHaveBeenCalled();
//     expect(mockDelete).toHaveBeenCalled();
//     expect(mockGetPosts).toHaveBeenCalled();
//   });

  it('displays empty state when no posts', async () => {
    (useApiFetch as jest.Mock).mockImplementation(() => ({
      get: vi.fn().mockResolvedValue([]),
      data: [],
      error: null,
      isLoading: false,
    }));

    render(
      <BrowserRouter>
        <PostsPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No posts found. Create your first post!')).toBeInTheDocument();
    });
  });
}); 
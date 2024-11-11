export const mockPost = { id: '1', title: 'Post 1', content: 'Content' };

export const mockPosts = [
  { id: '1', title: 'Post 1', content: 'Content' },
  { id: '2', title: 'Post 2', content: 'Content' },
];

export const mockNewPost =  (({ id, ...rest }) => ({ ...rest, authorId: '1' }))(mockPost);

export const mockCreatedPost = { ...mockNewPost, id: '1'};

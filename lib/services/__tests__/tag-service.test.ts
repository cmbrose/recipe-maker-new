/**
 * Tests for the tag service
 */

import { syncTags, getAllTagNames } from '../tag-service';

// Mock the database module
jest.mock('@/lib/db/mongo', () => ({
  getTagsCollection: jest.fn(),
}));

import { getTagsCollection } from '@/lib/db/mongo';

const mockGetTagsCollection = getTagsCollection as jest.MockedFunction<typeof getTagsCollection>;

const createMockCollection = () => ({
  bulkWrite: jest.fn().mockResolvedValue({}),
  find: jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      toArray: jest.fn().mockResolvedValue([]),
    }),
  }),
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncTags', () => {
  it('does nothing when given an empty array', async () => {
    const mockCollection = createMockCollection();
    mockGetTagsCollection.mockResolvedValue(mockCollection as any);

    await syncTags([]);

    expect(mockGetTagsCollection).not.toHaveBeenCalled();
    expect(mockCollection.bulkWrite).not.toHaveBeenCalled();
  });

  it('upserts each tag into the collection', async () => {
    const mockCollection = createMockCollection();
    mockGetTagsCollection.mockResolvedValue(mockCollection as any);

    await syncTags(['dinner', 'quick', 'healthy']);

    expect(mockCollection.bulkWrite).toHaveBeenCalledTimes(1);
    const ops = mockCollection.bulkWrite.mock.calls[0][0];
    expect(ops).toHaveLength(3);
    expect(ops[0]).toEqual({
      updateOne: {
        filter: { name: 'dinner' },
        update: { $setOnInsert: expect.objectContaining({ name: 'dinner' }) },
        upsert: true,
      },
    });
    expect(ops[1]).toEqual({
      updateOne: {
        filter: { name: 'quick' },
        update: { $setOnInsert: expect.objectContaining({ name: 'quick' }) },
        upsert: true,
      },
    });
    expect(ops[2]).toEqual({
      updateOne: {
        filter: { name: 'healthy' },
        update: { $setOnInsert: expect.objectContaining({ name: 'healthy' }) },
        upsert: true,
      },
    });
  });

  it('handles a single tag', async () => {
    const mockCollection = createMockCollection();
    mockGetTagsCollection.mockResolvedValue(mockCollection as any);

    await syncTags(['dessert']);

    const ops = mockCollection.bulkWrite.mock.calls[0][0];
    expect(ops).toHaveLength(1);
    expect(ops[0].updateOne.filter).toEqual({ name: 'dessert' });
    expect(ops[0].updateOne.upsert).toBe(true);
  });
});

describe('getAllTagNames', () => {
  it('returns sorted tag names from the collection', async () => {
    const mockCollection = createMockCollection();
    mockCollection.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        toArray: jest.fn().mockResolvedValue([
          { name: 'breakfast' },
          { name: 'dinner' },
          { name: 'quick' },
        ]),
      }),
    });
    mockGetTagsCollection.mockResolvedValue(mockCollection as any);

    const tags = await getAllTagNames();

    expect(tags).toEqual(['breakfast', 'dinner', 'quick']);
    expect(mockCollection.find).toHaveBeenCalledWith({}, { projection: { name: 1 } });
  });

  it('returns empty array when no tags exist', async () => {
    const mockCollection = createMockCollection();
    mockGetTagsCollection.mockResolvedValue(mockCollection as any);

    const tags = await getAllTagNames();

    expect(tags).toEqual([]);
  });
});

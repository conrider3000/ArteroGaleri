import { describe, it, expect } from 'vitest';
import { getMediaPage } from './galleries';

const UNKNOWN_GALLERY_ID = '00000000-0000-0000-0000-000000000000';

describe('getMediaPage', () => {
  for (const sortBy of ['dateTaken', 'name', 'size', 'camera', 'random', 'unknown-key']) {
    it(`runs with sortBy=${sortBy} without SQL errors`, async () => {
      const result = await getMediaPage({ galleryId: UNKNOWN_GALLERY_ID, sortBy });
      expect(result.items).toEqual([]);
      expect(result.nextCursor).toBeUndefined();
    });
  }

  it('runs with asc direction', async () => {
    const result = await getMediaPage({ galleryId: UNKNOWN_GALLERY_ID, sortDir: 'asc' });
    expect(result.items).toEqual([]);
  });

  it('ignores a malformed cursor instead of throwing', async () => {
    const result = await getMediaPage({ galleryId: UNKNOWN_GALLERY_ID, cursor: 'not-valid-json' });
    expect(result.items).toEqual([]);
  });

  it('accepts a well-formed cursor with null value', async () => {
    const cursor = Buffer.from(JSON.stringify({ value: null, id: UNKNOWN_GALLERY_ID })).toString('base64');
    const result = await getMediaPage({ galleryId: UNKNOWN_GALLERY_ID, cursor });
    expect(result.items).toEqual([]);
  });

  it('applies filters', async () => {
    const result = await getMediaPage({
      galleryId: UNKNOWN_GALLERY_ID,
      filters: { search: 'teste', kind: 'image', hasGps: true, tags: ['a', 'b'] },
    });
    expect(result.items).toEqual([]);
  });
});

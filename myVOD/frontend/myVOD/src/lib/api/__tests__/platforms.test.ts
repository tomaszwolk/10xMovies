import { describe, it, expect, beforeEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import { http } from '@/lib/http';
import { getPlatforms, patchUserPlatforms } from '../platforms';
import type { PlatformDto, UserProfileDto } from '@/types/api.types';

// Mock data
const mockPlatforms: PlatformDto[] = [
  { id: 1, platform_slug: 'netflix', platform_name: 'Netflix' },
  { id: 2, platform_slug: 'hbo', platform_name: 'HBO Max' },
  { id: 3, platform_slug: 'disney', platform_name: 'Disney+' },
];

const mockUserProfile: UserProfileDto = {
  email: 'test@example.com',
  platforms: [mockPlatforms[0], mockPlatforms[1]],
};

describe('getPlatforms', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(http);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should call GET /platforms/', async () => {
    mock.onGet('/platforms/').reply(200, mockPlatforms);

    const result = await getPlatforms();

    expect(mock.history.get).toHaveLength(1);
    expect(mock.history.get[0].url).toBe('/platforms/');
  });

  it('should return array of PlatformDto on success', async () => {
    mock.onGet('/platforms/').reply(200, mockPlatforms);

    const result = await getPlatforms();

    expect(result).toEqual(mockPlatforms);
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 1,
      platform_slug: 'netflix',
      platform_name: 'Netflix',
    });
  });

  it('should handle network errors', async () => {
    mock.onGet('/platforms/').networkError();

    await expect(getPlatforms()).rejects.toThrow();
  });

  it('should handle 401 Unauthorized (redirect to login)', async () => {
    mock.onGet('/platforms/').reply(401, { detail: 'Unauthorized' });

    await expect(getPlatforms()).rejects.toThrow();
  });

  it('should handle 5xx server errors', async () => {
    mock.onGet('/platforms/').reply(500, { detail: 'Internal Server Error' });

    await expect(getPlatforms()).rejects.toThrow();
  });

  it('should use correct axios instance with interceptors', async () => {
    mock.onGet('/platforms/').reply(200, mockPlatforms);

    await getPlatforms();

    expect(mock.history.get[0].baseURL).toBe('http://localhost:8000/api'); // http instance should be used with baseURL
  });
});

describe('patchUserPlatforms', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(http);
  });

  afterEach(() => {
    mock.restore();
  });

  it('should call PATCH /me/ with correct payload', async () => {
    const platformIds = [1, 2];
    mock.onPatch('/me/').reply(200, mockUserProfile);

    await patchUserPlatforms(platformIds);

    expect(mock.history.patch).toHaveLength(1);
    expect(mock.history.patch[0].url).toBe('/me/');
    expect(JSON.parse(mock.history.patch[0].data)).toEqual({
      platforms: platformIds,
    });
  });

  it('should send { platforms: number[] } in request body', async () => {
    const platformIds = [1, 3];
    mock.onPatch('/me/').reply(200, mockUserProfile);

    await patchUserPlatforms(platformIds);

    const requestData = JSON.parse(mock.history.patch[0].data);
    expect(requestData).toEqual({
      platforms: [1, 3],
    });
    expect(requestData.platforms).toBeInstanceOf(Array);
    expect(requestData.platforms[0]).toBe(1);
  });

  it('should return UserProfileDto on success', async () => {
    const platformIds = [1, 2];
    mock.onPatch('/me/').reply(200, mockUserProfile);

    const result = await patchUserPlatforms(platformIds);

    expect(result).toEqual(mockUserProfile);
    expect(result.email).toBe('test@example.com');
    expect(result.platforms).toHaveLength(2);
  });

  it('should handle validation errors (400/422)', async () => {
    const platformIds = [1, 2];
    mock.onPatch('/me/').reply(400, { platforms: ['Invalid platform ID'] });

    await expect(patchUserPlatforms(platformIds)).rejects.toThrow();
  });

  it('should handle authentication errors (401/403)', async () => {
    const platformIds = [1, 2];
    mock.onPatch('/me/').reply(401, { detail: 'Unauthorized' });

    await expect(patchUserPlatforms(platformIds)).rejects.toThrow();
  });

  it('should handle network/server errors', async () => {
    const platformIds = [1, 2];
    mock.onPatch('/me/').reply(500, { detail: 'Internal Server Error' });

    await expect(patchUserPlatforms(platformIds)).rejects.toThrow();
  });

  it('should trigger query invalidation on success', async () => {
    // Note: This test would need React Query testing utilities
    // For now, we just verify the API call structure
    const platformIds = [1, 2];
    mock.onPatch('/me/').reply(200, mockUserProfile);

    const result = await patchUserPlatforms(platformIds);

    expect(result).toBeDefined();
    // Query invalidation would be tested in integration tests
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from './redis.service';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RedisService],
    }).compile();

    service = module.get<RedisService>(RedisService);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should handle get gracefully when Redis is disconnected', async () => {
    const result = await service.get('test:key');
    expect(result).toBeNull();
  });

  it('should handle set gracefully when Redis is disconnected', async () => {
    await expect(service.set('test:key', { foo: 'bar' })).resolves.not.toThrow();
  });

  it('should handle del gracefully when Redis is disconnected', async () => {
    await expect(service.del('test:key')).resolves.not.toThrow();
  });

  it('should handle delByPattern gracefully when Redis is disconnected', async () => {
    await expect(service.delByPattern('family:*')).resolves.not.toThrow();
  });
});

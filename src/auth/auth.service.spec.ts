import { ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Token } from '../entity/token.entity';
import { User } from '../entity/user.entity';
import { AuthService } from './auth.service';
//unit
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;
  let tokenRepository: Repository<Token>;

  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        JWT_ACCESS_SECRET: 'test-access-secret',
        JWT_REFRESH_SECRET: 'test-refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Token),
          useValue: mockTokenRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tokenRepository = module.get<Repository<Token>>(getRepositoryToken(Token));

    jest.clearAllMocks();
  });

  it('should throw ConflictException when registering with existing username', async () => {
    const e111 = { id: 1, username: 'testuser' };
    mockUserRepository.findOne.mockResolvedValue(existingUser);

    await expect(service.register('testuser', 'password123')).rejects.toThrow(
      ConflictException,
    );

    expect(mockUserRepository.findOne).toHaveBeenCalledWith({
      where: { username: 'testuser' },
    });
  });
});

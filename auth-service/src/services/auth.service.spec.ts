import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RpcException } from '@nestjs/microservices';
import { HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service'; // Assuming your file is auth.service.ts
import { Tokens } from 'src/common/@types/token.type'; // Adjust path if needed

// Mock user data
const mockUser = {
  googleId: 'google-123',
  email: 'test@example.com',
  username: 'testuser',
};

const mockAccessTokenSecret = 'test-access-secret';
const mockRefreshTokenSecret = 'test-refresh-secret';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
  let cacheManager: Cache;

  // Store original process.env
  const originalEnv = process.env;

  beforeEach(async () => {
    // Mock process.env for these tests
    // For more robust solutions, consider using @nestjs/config and mocking ConfigService
    process.env = {
      ...originalEnv,
      ACCESS_TOKEN_SECRET: mockAccessTokenSecret,
      REFRESH_TOKEN_SECRET: mockRefreshTokenSecret,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(), // In case you add delete functionality later
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original process.env
    jest.clearAllMocks(); // Clear all mocks
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // --- Tests for generateJwtTokens method ---
  describe('generateJwtTokens', () => {
    it('should generate and cache access and refresh tokens successfully', async () => {
      const mockAccessToken = 'mock.access.token';
      const mockRefreshToken = 'mock.refresh.token';

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken) // First call for access token
        .mockReturnValueOnce(mockRefreshToken); // Second call for refresh token
      (cacheManager.set as jest.Mock).mockResolvedValue(undefined);

      const tokens = await service.generateJwtTokens(mockUser);

      expect(tokens).toEqual({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });

      // Check access token signing
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        1,
        {
          googleId: mockUser.googleId,
          email: mockUser.email,
          username: mockUser.username,
        },
        {
          expiresIn: '1h',
          secret: mockAccessTokenSecret,
        },
      );

      // Check refresh token signing
      expect(jwtService.sign).toHaveBeenNthCalledWith(
        2,
        {
          googleId: mockUser.googleId,
          email: mockUser.email,
          username: mockUser.username,
        },
        {
          expiresIn: '7d',
          secret: mockRefreshTokenSecret,
        },
      );

      // Check caching of refresh token
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      expect(cacheManager.set).toHaveBeenCalledWith(
        `refreshToken:${mockUser.googleId}`,
        mockRefreshToken,
        sevenDaysInSeconds,
      );
    });

    it('should throw RpcException if JWT signing fails', async () => {
      (jwtService.sign as jest.Mock).mockImplementation(() => {
        throw new Error('JWT Sign Error');
      });

      await expect(service.generateJwtTokens(mockUser)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Failed to generate JWT token',
        }),
      );
    });

    it('should throw RpcException if caching refresh token fails', async () => {
      const mockAccessToken = 'mock.access.token';
      const mockRefreshToken = 'mock.refresh.token';

      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(mockAccessToken)
        .mockReturnValueOnce(mockRefreshToken);
      (cacheManager.set as jest.Mock).mockRejectedValue(
        new Error('Cache set error'),
      ); // Simulate cache failure

      // The try-catch in the original method will catch this and re-throw an RpcException
      await expect(service.generateJwtTokens(mockUser)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED, // Based on the catch block in generateJwtTokens
          message: 'Failed to generate JWT token',
        }),
      );
    });
  });

  // --- Tests for refreshTokens method ---
  describe('refreshTokens', () => {
    const oldRefreshToken = 'old.refresh.token';
    const decodedUser = {
      googleId: 'google-123',
      email: 'test@example.com',
      username: 'testuser',
    };
    const newGeneratedTokens: Tokens = {
      accessToken: 'new.access.token',
      refreshToken: 'new.refresh.token',
    };

    it('should refresh tokens successfully if old refresh token is valid and cached', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(decodedUser);
      (cacheManager.get as jest.Mock).mockResolvedValue(oldRefreshToken);
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce(newGeneratedTokens.accessToken)
        .mockReturnValueOnce(newGeneratedTokens.refreshToken);
      (cacheManager.set as jest.Mock).mockResolvedValue(undefined); // For the new refresh token

      const result = await service.refreshTokens(oldRefreshToken);

      expect(jwtService.verify).toHaveBeenCalledWith(oldRefreshToken, {
        secret: mockRefreshTokenSecret,
      });
      expect(cacheManager.get).toHaveBeenCalledWith(
        `refreshToken:${decodedUser.googleId}`,
      );
      // Verifying that new tokens were generated based on decodedUser
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          googleId: decodedUser.googleId,
          email: decodedUser.email,
          username: decodedUser.username,
        },
        expect.objectContaining({
          secret: mockAccessTokenSecret,
          expiresIn: '1h',
        }),
      );
      expect(jwtService.sign).toHaveBeenCalledWith(
        {
          googleId: decodedUser.googleId,
          email: decodedUser.email,
          username: decodedUser.username,
        },
        expect.objectContaining({
          secret: mockRefreshTokenSecret,
          expiresIn: '7d',
        }),
      );
      // Verifying the new refresh token was cached
      expect(cacheManager.set).toHaveBeenCalledWith(
        `refreshToken:${decodedUser.googleId}`,
        newGeneratedTokens.refreshToken,
        60 * 60 * 24 * 7,
      );
      expect(result).toEqual(newGeneratedTokens);
    });

    it('should throw RpcException if refresh token verification fails', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshTokens(oldRefreshToken)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Failed to refresh tokens', // This is from the catch-all in refreshTokens
        }),
      );
    });

    it('should throw RpcException if refresh token is not found in cache', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(decodedUser);
      (cacheManager.get as jest.Mock).mockResolvedValue(null); // Token not in cache

      await expect(service.refreshTokens(oldRefreshToken)).rejects.toThrow(
        RpcException,
      );
    });

    it('should throw RpcException if token generation fails during refresh', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(decodedUser);
      (cacheManager.get as jest.Mock).mockResolvedValue(oldRefreshToken);
      (jwtService.sign as jest.Mock).mockImplementation(() => {
        // Simulate generateJwtTokens's sign failing
        throw new Error('Sign error during refresh');
      });

      await expect(service.refreshTokens(oldRefreshToken)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Failed to refresh tokens',
        }),
      );
    });
  });

  // --- Tests for verifyAccessToken method ---
  describe('verifyAccessToken', () => {
    const tokenToVerify = 'some.access.token';
    const decodedPayload = {
      googleId: 'google-123',
      email: 'test@example.com',
      username: 'testuser',
    };

    it('should return decoded payload for a valid access token', async () => {
      (jwtService.verify as jest.Mock).mockReturnValue(decodedPayload);

      const result = await service.verifyAccessToken(tokenToVerify);

      expect(jwtService.verify).toHaveBeenCalledWith(tokenToVerify, {
        secret: mockAccessTokenSecret,
      });
      expect(result).toEqual(decodedPayload);
    });

    it('should throw RpcException if access token verification fails', async () => {
      (jwtService.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.verifyAccessToken(tokenToVerify)).rejects.toThrow(
        new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Failed to verify access token',
        }),
      );
    });
  });
});

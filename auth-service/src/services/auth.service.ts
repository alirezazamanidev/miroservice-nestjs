import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { Tokens } from 'src/common/@types/token.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) readonly cacheManager: Cache,
  ) {}

  async generateJwtTokens(user: {
    googleId: string;
    email: string;
    username: string;
  }): Promise<Tokens> {
    try {
      const jwtPayload = {
        googleId: user.googleId,
        email: user.email,
        username: user.username,
      };
      const [at, rt] = await Promise.all([
        this.jwtService.sign(jwtPayload, {
          expiresIn: '1h',
          secret: process.env.ACCESS_TOKEN_SECRET,
        }),
        this.jwtService.sign(jwtPayload, {
          expiresIn: '7d',
          secret: process.env.REFRESH_TOKEN_SECRET,
        }),
      ]);

      // set refresh token in redis for 7 days
      const sevenDaysInSeconds = 7 * 24 * 60 * 60;
      await this.cacheManager.set(
        `refreshToken:${user.googleId}`,
        rt,
        sevenDaysInSeconds,
      );

      return { accessToken: at, refreshToken: rt };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Failed to generate JWT token',
      });
    }
  }
}

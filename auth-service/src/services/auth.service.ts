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
  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      // Decode the refresh token to get the googleId
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      // Check if the refresh token exists in cache
      const cachedToken = await this.cacheManager.get<string>(
        `refreshToken:${decoded.googleId}`,
      );

      if (!cachedToken) {
        throw new RpcException({
          status: HttpStatus.UNAUTHORIZED,
          message: 'Invalid or expired refresh token',
        });
      }
      // Generate new access and refresh tokens
      const newTokens = await this.generateJwtTokens({
        googleId: decoded.googleId,
        email: decoded.email,
        username: decoded.username,
      });
      await this.cacheManager.set(
        `refreshToken:${decoded.googleId}`,
        newTokens.refreshToken,
        60 * 60 * 24 * 7,
      ); // 7 days in seconds

 
      return newTokens;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Failed to refresh tokens',
      });
    }
  }

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
     console.log('ok');
     
      // set refresh token in redis for 7 days
     
       await this.cacheManager.set(
        `refreshToken:${user.googleId}`,
        rt,
        (7 * 24 * 60 * 60)
      ) // 7 days

   

      return { accessToken: at, refreshToken: rt };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Failed to generate JWT token',
      });
    }
  }
  async verifyAccessToken(token:string){
    try {
        
        return this.jwtService.verify(token, {
          secret: process.env.ACCESS_TOKEN_SECRET,
        });
        
        
    } catch (error) {
        throw new RpcException({
            status: HttpStatus.UNAUTHORIZED,
            message: 'Failed to verify access token',
          });
    }
  }
}

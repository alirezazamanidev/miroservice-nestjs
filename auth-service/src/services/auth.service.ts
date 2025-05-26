import { HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RpcException } from '@nestjs/microservices';
import { Tokens } from 'src/common/@types/token.type';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

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

   
      return { accessToken: at, refreshToken: rt };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Failed to generate JWT token',
      });
    }
  }
}

import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { Services } from 'src/common/enums/nameService.enum';
import { ClientProxy } from '@nestjs/microservices';
import { PatternNameEnum } from 'src/common/enums/pattern.enum';
import { catchError, firstValueFrom, lastValueFrom } from 'rxjs';
import { CookieNameEnum } from 'src/common/enums/cookie-name.enum';
import { access } from 'fs';
import { Auth } from './decorators/auth.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(Services.AUTH_SERVICE) private readonly authClient: ClientProxy,
  ) {}

  @ApiOperation({ summary: 'login with Google' })
  @UseGuards(AuthGuard('google'))
  @Get('google/login')
  async googleLogin() {
    return { message: 'Redirecting to Google for authentication' };
  }

  @ApiOperation({ summary: 'Google callback' })
  @UseGuards(AuthGuard('google'))
  @Get('google/callback')
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    // Send user information to the auth service for further processing
    
    const result = await lastValueFrom(
      this.authClient.send(PatternNameEnum.GOOGLE_LOGIN, req.user).pipe(
        catchError((error) => {
          console.log(error);
          
          throw new HttpException(
            {
              status: error.status || 500,
              message: error.message || 'Internal Server Error',
            },
            error.status || 500,
          );
        }),
      ),
    );
    if (!result) throw new UnauthorizedException('login failed!');

    res
      .cookie(CookieNameEnum.REFRESH_TOKEN, result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',

        expires: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      })
      .cookie(CookieNameEnum.ACCESS_TOKEN, result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(Date.now() + 1 * 3600 * 1000),
      })
    
        res.status(HttpStatus.OK).json({ message: "login successFully", accessToken: result.accessToken });
  }
  @ApiOperation({ summary: 'refresh  token' })
  @Get('refresh')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    // get refresh token from cookie
    const refreshToken = req.cookies?.[CookieNameEnum.REFRESH_TOKEN];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    try {
      const result = await firstValueFrom(
        this.authClient.send(PatternNameEnum.REFRESH_TOKEN, {
          refreshToken,
        }),
      );
      if (!result || !result.accessToken || !result.refreshToken) {
        throw new UnauthorizedException('Failed to refresh tokens');
      }
      res
        .cookie(CookieNameEnum.REFRESH_TOKEN, result.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',

          expires: new Date(Date.now() + 7 * 24 * 3600 * 1000),
        })
        .json({
          [CookieNameEnum.ACCESS_TOKEN]: result.accessToken,
          message: 'Token refreshed successfully',
        });
    } catch (error) {
      res.clearCookie(CookieNameEnum.REFRESH_TOKEN, { path: '/' });
      throw new UnauthorizedException(
        'Invalid refresh token, please login again.',
      );
    }
  }

  @Auth()
  @ApiOperation({summary:"payload user"})
  @Get('payload-user')
  payload(@Req() req: Request) {
    return req.user
  }
}

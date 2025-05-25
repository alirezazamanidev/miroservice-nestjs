import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
    const user = req.user;
    if (!user) {
      return res.redirect('http://frontEnd/login?error=true');
    }
    
    
  }
}

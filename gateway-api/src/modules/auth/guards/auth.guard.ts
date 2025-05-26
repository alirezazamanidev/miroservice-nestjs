import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { isJWT } from 'class-validator';
import { Request } from 'express';
import { catchError, last, lastValueFrom, Observable } from 'rxjs';
import { CookieNameEnum } from 'src/common/enums/cookie-name.enum';
import { Services } from 'src/common/enums/nameService.enum';
import { PatternNameEnum } from 'src/common/enums/pattern.enum';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Services.AUTH_SERVICE)
    private readonly authClientService: ClientProxy,
  ) {}
  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies?.[CookieNameEnum.ACCESS_TOKEN];
    if (!token) throw new UnauthorizedException('Access token is missing');
    if (!isJWT(token))
      throw new UnauthorizedException('Invalid access token format');
    const result = await lastValueFrom(
      this.authClientService
        .send(PatternNameEnum.VERIFY_ACCESS_TOKEN, { accessToken: token })
        .pipe(
          catchError((error) => {
            console.log(error);
            
            throw new UnauthorizedException('Invalid access token');
          }),
        ),
    );
    request.user= result;
    return true;
  }
}

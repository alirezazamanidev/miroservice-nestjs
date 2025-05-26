import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus: number;
    let message: string;
    let details: any = {};
    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();
      if (typeof response === 'string') {
        message = response;
      } else {
        const resObj = response as any;
        message = resObj.message;
        details = resObj.error || {};
      }
    } else if (exception instanceof RpcException) {

      const rpcError = exception.getError();
      if (typeof rpcError === 'string') {
        httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        message = rpcError;
      } else {
        const errorObj = rpcError as any;
        httpStatus = errorObj.status || HttpStatus.INTERNAL_SERVER_ERROR;
        message = errorObj.message || 'An unexpected error occurred in a microservice.';
        details = errorObj.details || {};
      }
    } else {

      httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An internal server error occurred.';

      this.logger.error('Unhandled Exception:', exception);
    }

    const responseBody = {
      statusCode: httpStatus,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
    };
    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
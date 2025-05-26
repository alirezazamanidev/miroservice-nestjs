import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as compression from 'compression';
import SwaggerConfig from 'src/configs/swagger.config';
import * as cookieParser from 'cookie-parser';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from 'src/common/filters/all-exceptions.filter';
import { ValidationPipe } from '@nestjs/common';

export const appInitialization = (app: NestExpressApplication) => {
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  // filters config
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // middlewares
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // set prefix for API
  app.setGlobalPrefix('api');
  // swagger config
  SwaggerConfig(app);
};

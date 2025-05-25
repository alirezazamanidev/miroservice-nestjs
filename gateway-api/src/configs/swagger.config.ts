import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SecuritySchemeObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';

export default function SwaggerConfig(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('********* app microsirvice  **********')

    .addSecurity('Authorization', SwaggerAuthConfig())
    .build();
  const theme = new SwaggerTheme();
  const options = {
    explorer: true,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
  };

  const document = SwaggerModule.createDocument(app, config, {});
  SwaggerModule.setup('docs', app, document, options);
}
function SwaggerAuthConfig(): SecuritySchemeObject {
  return {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    name: 'authorization',
    in: 'header',
  };
}
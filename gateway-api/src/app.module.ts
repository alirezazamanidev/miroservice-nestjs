import { Module } from '@nestjs/common';
import { appExternalImports } from './app/imports/external.imports';
import { appInternalImports } from './app/imports/internal.imports';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    ...appExternalImports,
    ...appInternalImports,
    AuthModule
  ],
  
})
export class AppModule {}

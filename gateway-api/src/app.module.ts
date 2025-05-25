import { Module } from '@nestjs/common';
import { appExternalImports } from './app/imports/external.imports';
import { appInternalImports } from './app/imports/internal.imports';

@Module({
  imports: [
    ...appExternalImports,
    ...appInternalImports,

  ],
  
})
export class AppModule {}

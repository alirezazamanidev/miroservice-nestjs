import { ConfigModule } from "@nestjs/config";

export const appExternalImports = [
 
    ConfigModule.forRoot({
        isGlobal: true,
        envFilePath:'.env',
    }),
   
]
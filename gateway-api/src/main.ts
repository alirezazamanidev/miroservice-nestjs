import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appInitialization } from './app';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // app initialization
  appInitialization(app);

  const PORT = process.env.APP_PORT || 3000;
await app.listen(PORT, () => {
  console.log('\n========================================\n');
  console.log(`🚀  Server is running at:    http://localhost:${PORT}/api`);
  console.log(`📘  Swagger docs available: http://localhost:${PORT}/docs`);
  console.log(`📡  Listening for messages on RabbitMQ...`);
  console.log(`🕒  Started at: ${new Date().toLocaleTimeString()}`);
  console.log('\n========================================\n');
});
}
bootstrap();

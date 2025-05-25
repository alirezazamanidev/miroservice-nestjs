import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${process.env.RABBITMQ_HOST ?? 'localhost'}:${process.env.RABBITMQ_PORT ?? 5672}`,
        ],
        queue: 'auth',
        queueOptions: {
          durable: false,
        },
      },
    },
  );

  await app.listen();
  console.log('========================================');

  console.log(`✅  Auth Microservice is running and connected to RabbitMQ`);
  console.log(
    `🐇  Broker: amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
  );
  console.log(`🕒  Started at: ${new Date().toLocaleTimeString()}`);
  console.log('========================================');
}
bootstrap();

import { NestFactory } from '@nestjs/core';
import { FileModule } from './file.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    FileModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [
          `amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
        ],
        queue: 'file',
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  await app.listen();
  console.log('========================================');

  console.log(`✅  File Microservice is running and connected to RabbitMQ`);
  console.log(
    `🐇  Broker: amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`,
  );
  console.log(`🕒  Started at: ${new Date().toLocaleTimeString()}`);
  console.log('========================================');
}
bootstrap();

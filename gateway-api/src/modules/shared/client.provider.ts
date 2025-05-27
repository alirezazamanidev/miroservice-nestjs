import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { Services } from 'src/common/enums/nameService.enum';
export const AuthClientProvider = {
  provide: Services.AUTH_SERVICE,
  useFactory: () => {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`],
        queue: 'auth',
        queueOptions: {
          durable: false,
        },
      },
    });
  },
};

export const FileClientProvider = {
  provide: Services.FILE_SERVICE,
  useFactory: () => {
    return ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [`amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`],
        queue: 'file',
        queueOptions: {
          durable: false,
        },
      },
    });
  },
};
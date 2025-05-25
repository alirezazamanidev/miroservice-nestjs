import { ConfigModule } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { NameService } from "src/common/enums/nameService.enum";

export const appExternalImports = [

    ConfigModule.forRoot({
        isGlobal: true,
        envFilePath:'.env',
    }),
    ClientsModule.register([
        {
            name: NameService.AUTH_SERVICE,
            transport: Transport.RMQ,
            options: {
                urls: [`amqp://${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}`],
                queue: process.env.RMQ_QUEUE,
                queueOptions: {
                    durable: false
                },
            },
        },
    ]),
]
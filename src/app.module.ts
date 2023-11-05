import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './modules/prisma/prisma.module';
import { LoggingInterceptor } from './middleware/logging.interceptor';
import { JsonHeaderInterceptor } from './middleware/jsonHeader.interceptor';
import { MiscModule } from './modules/misc/misc.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    PrismaModule,
    MiscModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: JsonHeaderInterceptor,
    },
  ],
})
export class AppModule {}

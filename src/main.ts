import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { BigIntSerializerPipe } from './common/pipes/bigIntSerializer.pipe';
import { BigIntInterceptor } from './common/interceptors/bigInt.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  // enabling swagger only on development
  if (process.env.NODE_ENV === 'development') {
    const config = new DocumentBuilder()
      .setTitle('BWB API')
      .setDescription("BWB")
      .setVersion('1.0')
      .addTag('BWB Code System')
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      include: [],
      deepScanRoutes: true,
      operationIdFactory: (controllerKey: string, methodKey: string) =>
        methodKey,
    });
    SwaggerModule.setup('api', app, document);
  }
  app.useGlobalPipes(new ValidationPipe(), new BigIntSerializerPipe());
  app.useGlobalInterceptors(new BigIntInterceptor());
  await app.listen(9100);
}
bootstrap();

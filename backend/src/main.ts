import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  // Browsers reject `Access-Control-Allow-Origin: *` whenever a request is made
  // with credentials (cookies / Authorization header via fetch's credentials: 'include').
  // So origin must be an explicit allow-list, not a wildcard, and credentials must be enabled.
  const allowedOrigins = (
    process.env.CORS_ORIGIN || 'http://localhost:3001,http://localhost:3000'
  )
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`Backend listening on port ${port} on 0.0.0.0`);
}
bootstrap();
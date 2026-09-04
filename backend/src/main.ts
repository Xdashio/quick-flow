import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { createHash } from 'crypto';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
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

  // TEMP DEBUG — remove after confirming secret parity with dashboard.
  // Logs a short hash, never the secret itself.
  const secret = process.env.JWT_SECRET ?? 'dev-jwt-secret-change-in-production';
  const secretHash = createHash('sha256').update(secret).digest('hex').slice(0, 12);
  // eslint-disable-next-line no-console
  console.log(`[debug] JWT_SECRET fingerprint: ${secretHash} (length ${secret.length})`);
}
bootstrap();
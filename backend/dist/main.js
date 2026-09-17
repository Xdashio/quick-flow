"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    const defaultOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        'https://dash.crestcyber.co.ke',
        'https://register.crestcyber.co.ke',
    ];
    const envOrigins = (process.env.CORS_ORIGIN || '')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    const allowedOrigins = Array.from(new Set([...defaultOrigins, ...envOrigins]));
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin)
                return callback(null, true);
            if (allowedOrigins.includes(origin) ||
                origin.endsWith('.crestcyber.co.ke') ||
                origin === 'https://crestcyber.co.ke') {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    await app.listen(port, '0.0.0.0');
    console.log(`Backend listening on port ${port} on 0.0.0.0`);
}
bootstrap().catch((err) => {
    console.error('Backend failed to start:', err?.message ?? err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map
import 'reflect-metadata';
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { leerConfiguracion } from './config/configuracion';
import { configurarApp } from './http/configurar-app';

export async function bootstrap() {
  const config = leerConfiguracion();
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configurarApp(app, config);
  await app.listen(config.puerto);
  return app;
}

if (require.main === module) {
  void bootstrap().catch((error: unknown) => {
    Logger.error('No se pudo iniciar FastExpress.', error);
    process.exitCode = 1;
  });
}

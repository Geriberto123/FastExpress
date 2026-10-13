import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json } from 'express';
import helmet from 'helmet';
import type { Configuracion } from '../config/configuracion';
import { HttpErrorFilter } from './http-error.filter';
import { rechazarClavesReservadas } from './json-seguro';

export function configurarApp(
  app: INestApplication,
  config: Configuracion,
): void {
  app.setGlobalPrefix('api');
  app.use(helmet());
  app.use(json({ limit: '16kb', reviver: rechazarClavesReservadas }));
  app.enableCors({
    origin: [...config.origenesCors],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      whitelist: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      validationError: { target: false, value: false },
      exceptionFactory: (validaciones) => {
        const errores = validaciones.flatMap((error) =>
          Object.values(error.constraints ?? {}),
        );
        return new BadRequestException({
          mensaje: 'La solicitud contiene datos inválidos.',
          errores,
        });
      },
    }),
  );
  app.useGlobalFilters(new HttpErrorFilter());

  const opciones = new DocumentBuilder()
    .setTitle('FastExpress')
    .setDescription(
      'Cotización de envíos en USD. EXPRESS se calcula sobre el subtotal original.',
    )
    .setVersion('1.0.0')
    .build();
  const documento = SwaggerModule.createDocument(app, opciones);
  SwaggerModule.setup('api/docs', app, documento);
}

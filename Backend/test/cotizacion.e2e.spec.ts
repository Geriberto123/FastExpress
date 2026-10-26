import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { INestApplication, Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { leerConfiguracion } from '../src/config/configuracion';
import { configurarApp } from '../src/http/configurar-app';
import { CALCULADOR_TARIFA } from '../src/cotizacion/domain/cotizacion';
import { CotizacionInvalidaError } from '../src/cotizacion/domain/validar-entrada';
import {
  CASOS_DECISION,
  CASOS_FRONTERA_VALIDOS,
} from './fixtures/cotizaciones';

describe('API FastExpress (configuración HTTP real)', () => {
  let app: INestApplication;
  const entrada = { peso: 5, tipoCliente: 'VIP', tipoEnvio: 'EXPRESS' };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication({ bodyParser: false, logger: false });
    configurarApp(app, leerConfiguracion({}));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it.each(CASOS_DECISION)(
    '$peso kg/$tipoCliente/$tipoEnvio = $total',
    async (caso) => {
      const respuesta = await request(app.getHttpServer())
        .post('/api/cotizar')
        .send({
          peso: caso.peso,
          tipoCliente: caso.tipoCliente,
          tipoEnvio: caso.tipoEnvio,
        })
        .expect(200);
      expect(respuesta.body).toEqual({
        base: 5,
        costoPeso: caso.peso === 5 ? 10 : 24,
        descuento: caso.descuento,
        recargo: caso.recargo,
        total: caso.total,
      });
    },
  );

  it.each(CASOS_FRONTERA_VALIDOS)('acepta frontera $peso kg', async (caso) => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cotizar')
      .send({
        ...entrada,
        peso: caso.peso,
        tipoCliente: 'NUEVO',
        tipoEnvio: 'ESTANDAR',
      })
      .expect(200);
    expect(respuesta.body).toEqual({
      base: 5,
      costoPeso: caso.costoPeso,
      descuento: 0,
      recargo: 0,
      total: caso.total,
    });
  });

  it.each([
    { ...entrada, peso: 0 },
    { ...entrada, peso: -1 },
    { ...entrada, peso: 20.01 },
    { ...entrada, peso: 5.001 },
    { ...entrada, peso: '5' },
    { ...entrada, peso: '5,01' },
    { ...entrada, peso: null },
    { ...entrada, peso: true },
    { ...entrada, peso: [] },
    { ...entrada, peso: {} },
    { ...entrada, tipoCliente: 'vip' },
    { ...entrada, tipoCliente: 'toString' },
    { ...entrada, tipoCliente: '__proto__' },
    { ...entrada, tipoCliente: null },
    { ...entrada, tipoEnvio: 'URGENTE' },
    { ...entrada, tipoEnvio: null },
    { ...entrada, monto: 100 },
    { ...entrada, administrador: true },
    { tipoCliente: 'VIP', tipoEnvio: 'EXPRESS' },
    { peso: 5, tipoEnvio: 'EXPRESS' },
    { peso: 5, tipoCliente: 'VIP' },
    {},
    [],
  ])('rechaza payload inválido %j', async (datos) => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cotizar')
      .send(datos)
      .expect(400);
    expect(respuesta.body).toEqual({
      statusCode: 400,
      mensaje: expect.any(String),
      errores: expect.any(Array),
    });
    expect(respuesta.body.errores.length).toBeGreaterThan(0);
    expect(respuesta.body).not.toHaveProperty('stack');
  });

  it.each(['null', 'true', '"5"', '1e400', '{"peso":NaN}', '{"peso":5,', ''])(
    'rechaza cuerpo JSON %s',
    async (datos) => {
      const respuesta = await request(app.getHttpServer())
        .post('/api/cotizar')
        .set('Content-Type', 'application/json')
        .send(datos)
        .expect(400);
      expect(respuesta.body.statusCode).toBe(400);
      expect(typeof respuesta.body.mensaje).toBe('string');
    },
  );

  it('rechaza números no finitos dentro de JSON', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cotizar')
      .set('Content-Type', 'application/json')
      .send('{"peso":1e400,"tipoCliente":"VIP","tipoEnvio":"EXPRESS"}')
      .expect(400);
    expect(respuesta.body.errores).toContain(
      'El peso debe ser un número finito con máximo 2 decimales.',
    );
  });

  it('respeta redondeo por importe y serializa solamente números', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cotizar')
      .send({ ...entrada, peso: 0.01 })
      .expect(200);
    expect(respuesta.body).toEqual({
      base: 5,
      costoPeso: 0.02,
      descuento: 1,
      recargo: 1.26,
      total: 5.28,
    });
    expect(
      Object.values(respuesta.body).every((valor) => typeof valor === 'number'),
    ).toBe(true);
  });

  it('rechaza cuerpos mayores a 16 KiB', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cotizar')
      .send({ ...entrada, relleno: 'x'.repeat(17 * 1024) })
      .expect(413);
    expect(respuesta.body).toEqual({
      statusCode: 413,
      mensaje: 'El cuerpo JSON excede el límite de 16 KiB.',
      errores: [],
    });
  });

  it.each(['__proto__', 'constructor', 'prototype'])(
    'rechaza explícitamente la clave reservada %s antes de transformar el DTO',
    async (clave) => {
      const respuesta = await request(app.getHttpServer())
        .post('/api/cotizar')
        .send({ ...entrada, [clave]: { administrador: true } })
        .expect(400);
      expect(respuesta.body.statusCode).toBe(400);
      expect(typeof respuesta.body.mensaje).toBe('string');
      expect(Object.prototype).not.toHaveProperty('administrador');
    },
  );

  it('expone health y cabeceras de Helmet', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    expect(respuesta.body).toEqual({ status: 'ok' });
    expect(respuesta.headers['x-content-type-options']).toBe('nosniff');
    expect(respuesta.headers).not.toHaveProperty('x-powered-by');
  });

  it.each(['http://localhost:5500', 'http://127.0.0.1:5500'])(
    'autoriza preflight para %s',
    async (origen) => {
      const respuesta = await request(app.getHttpServer())
        .options('/api/cotizar')
        .set('Origin', origen)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'content-type')
        .expect(204);
      expect(respuesta.headers['access-control-allow-origin']).toBe(origen);
      expect(respuesta.headers['access-control-allow-methods']).toContain(
        'POST',
      );
      expect(respuesta.headers).not.toHaveProperty(
        'access-control-allow-credentials',
      );
    },
  );

  it('no concede CORS a orígenes ajenos', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/health')
      .set('Origin', 'https://ajeno.example')
      .expect(200);
    expect(respuesta.headers).not.toHaveProperty('access-control-allow-origin');
  });

  it('publica Swagger y el contrato OpenAPI', async () => {
    await request(app.getHttpServer())
      .get('/api/docs/')
      .expect(200)
      .expect('Content-Type', /html/);
    const respuesta = await request(app.getHttpServer())
      .get('/api/docs-json')
      .expect(200);
    expect(
      respuesta.body.paths['/api/cotizar'].post.responses['200'],
    ).toBeDefined();
    expect(
      respuesta.body.paths['/api/cotizar'].post.responses['400'],
    ).toBeDefined();
    expect(
      respuesta.body.components.schemas.CotizarDto.properties.peso,
    ).toMatchObject({ minimum: 0.01, maximum: 20, multipleOf: 0.01 });
  });

  it('normaliza rutas inexistentes', async () => {
    const respuesta = await request(app.getHttpServer())
      .get('/api/inexistente')
      .expect(404);
    expect(respuesta.body).toEqual({
      statusCode: 404,
      mensaje: expect.any(String),
      errores: expect.any(Array),
    });
  });

  it.each([
    {
      causa: new CotizacionInvalidaError('Cotización inválida de prueba.'),
      statusCode: 400,
      mensaje: 'Cotización inválida de prueba.',
    },
    {
      causa: new Error('SECRETO_INTERNO'),
      statusCode: 500,
      mensaje: 'Error interno del servidor.',
    },
  ])('traduce una falla del proveedor a HTTP $statusCode', async (caso) => {
    const registrar = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CALCULADOR_TARIFA)
      .useValue({
        calcular: () => {
          throw caso.causa;
        },
      })
      .compile();
    const appConFalla = modulo.createNestApplication({
      bodyParser: false,
      logger: false,
    });
    configurarApp(appConFalla, leerConfiguracion({}));
    await appConFalla.init();
    try {
      const respuesta = await request(appConFalla.getHttpServer())
        .post('/api/cotizar')
        .send(entrada)
        .expect(caso.statusCode);
      expect(respuesta.body.mensaje).toBe(caso.mensaje);
      expect(respuesta.body.statusCode).toBe(caso.statusCode);
      expect(JSON.stringify(respuesta.body)).not.toContain('SECRETO_INTERNO');
      if (caso.statusCode === 500) expect(registrar).toHaveBeenCalled();
    } finally {
      await appConFalla.close();
      registrar.mockRestore();
    }
  });
});

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from './app.module';
import { bootstrap } from './main';

describe('Arranque de FastExpress', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('arranca con configuración compartida y sirve la API', async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = modulo.createNestApplication({
      bodyParser: false,
      logger: false,
    });
    // Puerto efímero para no ocupar el 8000 del usuario durante las pruebas.
    const escuchar = app.listen.bind(app);
    jest.spyOn(app, 'listen').mockImplementation(() => escuchar(0));
    jest.spyOn(NestFactory, 'create').mockResolvedValue(app);
    const iniciada = await bootstrap();
    try {
      await request(iniciada.getHttpServer())
        .get('/api/health')
        .expect(200, { status: 'ok' });
      const respuesta = await request(iniciada.getHttpServer())
        .post('/api/cotizar')
        .send({ peso: 5, tipoCliente: 'VIP', tipoEnvio: 'EXPRESS' })
        .expect(200);
      expect(respuesta.body.total).toBe(15.75);
    } finally {
      await iniciada.close();
    }
  });

  it('propaga fallos de creación para que el proceso termine con error', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    jest
      .spyOn(NestFactory, 'create')
      .mockRejectedValue(new Error('No disponible.'));
    await expect(bootstrap()).rejects.toThrow('No disponible.');
  });
});

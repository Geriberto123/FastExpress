import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { leerConfiguracion } from '../src/config/configuracion';
import { configurarApp } from '../src/http/configurar-app';

describe('CP caja negra trazable', () => {
  let app: INestApplication;
  const base = { tipoCliente: 'NUEVO', tipoEnvio: 'ESTANDAR' };

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication({ bodyParser: false, logger: false });
    configurarApp(app, leerConfiguracion({}));
    await app.init();
  });
  afterAll(async () => app.close());

  it.each([
    ['CP-101', 0.01, 5.02],
    ['CP-102', 0.02, 5.04],
    ['CP-103', 4.99, 14.98],
    ['CP-104', 5, 15],
    ['CP-105', 5.01, 25.04],
    ['CP-106', 5.02, 25.08],
    ['CP-107', 19.99, 84.96],
    ['CP-108', 20, 85],
  ])('%s BVA válida peso %s', async (_id, peso, total) => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cotizar')
      .send({ ...base, peso })
      .expect(200);
    expect(respuesta.body.total).toBe(total);
  });

  it.each([
    ['CP-109', 0],
    ['CP-110', 20.01],
    ['CP-111', 20.001],
    ['CP-112', 0.001],
  ])('%s rechaza frontera inválida %s', async (_id, peso) => {
    await request(app.getHttpServer())
      .post('/api/cotizar')
      .send({ ...base, peso })
      .expect(400);
  });

  it.each([
    ['CP-201', 'NUEVO', 'ESTANDAR', 0, 0, 9],
    ['CP-202', 'NUEVO', 'EXPRESS', 0, 2.25, 11.25],
    ['CP-203', 'FRECUENTE', 'ESTANDAR', 0.9, 0, 8.1],
    ['CP-204', 'FRECUENTE', 'EXPRESS', 0.9, 2.25, 10.35],
    ['CP-205', 'VIP', 'ESTANDAR', 1.8, 0, 7.2],
    ['CP-206', 'VIP', 'EXPRESS', 1.8, 2.25, 9.45],
  ])(
    '%s decisión 2 kg',
    async (_id, tipoCliente, tipoEnvio, descuento, recargo, total) => {
      const respuesta = await request(app.getHttpServer())
        .post('/api/cotizar')
        .send({ peso: 2, tipoCliente, tipoEnvio })
        .expect(200);
      expect(respuesta.body).toMatchObject({ descuento, recargo, total });
    },
  );

  it('CP-207 0.03 kg EXPRESS NUEVO usa half-up', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/api/cotizar')
      .send({ peso: 0.03, tipoCliente: 'NUEVO', tipoEnvio: 'EXPRESS' })
      .expect(200);
    expect(respuesta.body).toMatchObject({ recargo: 1.27, total: 6.33 });
  });
});

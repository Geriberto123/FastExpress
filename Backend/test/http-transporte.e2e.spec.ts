import { afterAll, beforeAll, describe, expect, it } from '@jest/globals';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { gzipSync } from 'node:zlib';
import { AppModule } from '../src/app.module';
import { leerConfiguracion } from '../src/config/configuracion';
import type { CotizacionRespuestaDto } from '../src/cotizacion/http/cotizacion-respuesta.dto';
import { configurarApp } from '../src/http/configurar-app';
import type { ErrorRespuestaDto } from '../src/http/error-respuesta.dto';

interface CasoTransporte {
  readonly nombre: string;
  readonly cuerpo: string | Buffer;
  readonly cabeceras: Readonly<Record<string, string>>;
  readonly statusCode: number;
  readonly esperado: CotizacionRespuestaDto | ErrorRespuestaDto;
}

const entrada = JSON.stringify({
  peso: 5,
  tipoCliente: 'VIP',
  tipoEnvio: 'EXPRESS',
});
const cotizacion = {
  base: 5,
  costoPeso: 10,
  descuento: 3,
  recargo: 3.75,
  total: 15.75,
};
const errorJson = {
  statusCode: 400,
  mensaje: 'El cuerpo de la solicitud no contiene JSON válido.',
  errores: [],
};
const errorTamano = {
  statusCode: 413,
  mensaje: 'El cuerpo JSON excede el límite de 16 KiB.',
  errores: [],
};
const errorCodificacion = {
  statusCode: 415,
  mensaje: 'La codificación o el charset del cuerpo JSON no está admitido.',
  errores: [],
};
const cuerpoGrande = JSON.stringify({ relleno: 'x'.repeat(17 * 1024) });

const casos: readonly CasoTransporte[] = [
  {
    nombre: 'JSON válido',
    cuerpo: entrada,
    cabeceras: {},
    statusCode: 200,
    esperado: cotizacion,
  },
  {
    nombre: 'gzip válido',
    cuerpo: gzipSync(entrada),
    cabeceras: { 'Content-Encoding': 'gzip' },
    statusCode: 200,
    esperado: cotizacion,
  },
  {
    nombre: 'JSON malformado con dato privado',
    cuerpo: '{"DATO_PRIVADO":',
    cabeceras: {},
    statusCode: 400,
    esperado: errorJson,
  },
  {
    nombre: 'gzip corrupto',
    cuerpo: Buffer.from('DATO_PRIVADO'),
    cabeceras: { 'Content-Encoding': 'gzip' },
    statusCode: 400,
    esperado: errorJson,
  },
  {
    nombre: 'JSON mayor a 16 KiB',
    cuerpo: cuerpoGrande,
    cabeceras: {},
    statusCode: 413,
    esperado: errorTamano,
  },
  {
    nombre: 'JSON comprimido que supera 16 KiB descomprimido',
    cuerpo: gzipSync(cuerpoGrande),
    cabeceras: { 'Content-Encoding': 'gzip' },
    statusCode: 413,
    esperado: errorTamano,
  },
  {
    nombre: 'charset no admitido',
    cuerpo: entrada,
    cabeceras: { 'Content-Type': 'application/json; charset=iso-8859-1' },
    statusCode: 415,
    esperado: errorCodificacion,
  },
  {
    nombre: 'codificación no admitida',
    cuerpo: entrada,
    cabeceras: { 'Content-Encoding': 'compress' },
    statusCode: 415,
    esperado: errorCodificacion,
  },
];

describe('Transporte HTTP y CORS con servidor real', () => {
  let app: INestApplication;
  let url: string;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = modulo.createNestApplication({ bodyParser: false, logger: false });
    configurarApp(app, leerConfiguracion({}));
    await app.listen(0, '127.0.0.1');
    url = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  describe.each([
    { origen: 'http://localhost:5500', permitido: true },
    { origen: 'http://127.0.0.1:5500', permitido: true },
    { origen: 'https://ajeno.example', permitido: false },
  ])('Origen $origen (permitido=$permitido)', ({ origen, permitido }) => {
    it.each(casos)('$nombre → $statusCode', async (caso) => {
      const respuesta = await fetch(`${url}/api/cotizar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: origen,
          ...caso.cabeceras,
        },
        body: caso.cuerpo,
      });
      expect(respuesta.status).toBe(caso.statusCode);
      expect(await respuesta.json()).toEqual(caso.esperado);
      expect(respuesta.headers.get('Access-Control-Allow-Origin')).toBe(
        permitido ? origen : null,
      );
      expect(
        respuesta.headers.get('Access-Control-Allow-Credentials'),
      ).toBeNull();
      expect(respuesta.headers.get('X-Content-Type-Options')).toBe('nosniff');

      // Un error de entrada no debe dejar el proceso caído ni inutilizable.
      const estado = await fetch(`${url}/api/health`);
      expect(estado.status).toBe(200);
      expect(await estado.json()).toEqual({ status: 'ok' });
    });
  });

  it('publica 400, 413, 415 y 500 con el esquema de error en OpenAPI', async () => {
    const respuesta = await fetch(`${url}/api/docs-json`);
    const documento: unknown = await respuesta.json();
    for (const codigo of ['400', '413', '415', '500']) {
      expect(documento).toHaveProperty(
        [
          'paths',
          '/api/cotizar',
          'post',
          'responses',
          codigo,
          'content',
          'application/json',
          'schema',
          '$ref',
        ],
        '#/components/schemas/ErrorRespuestaDto',
      );
    }
  });
});

import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  Logger,
} from '@nestjs/common';
import createHttpError from 'http-errors';
import { CotizacionInvalidaError } from '../cotizacion/domain/validar-entrada';
import { HttpErrorFilter } from './http-error.filter';

describe('HttpErrorFilter', () => {
  let registrarError: jest.Spied<Logger['error']>;

  beforeEach(() => {
    registrarError = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
  });
  afterEach(() => {
    registrarError.mockRestore();
  });

  function responder(error: unknown) {
    const respuesta = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const host = {
      switchToHttp: () => ({ getResponse: () => respuesta }),
    } as unknown as ArgumentsHost;
    new HttpErrorFilter().catch(error, host);
    return respuesta;
  }

  it('traduce errores de dominio a 400', () => {
    const respuesta = responder(
      new CotizacionInvalidaError('Límite excedido.'),
    );
    expect(respuesta.status).toHaveBeenCalledWith(400);
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 400,
      mensaje: 'Límite excedido.',
      errores: ['Límite excedido.'],
    });
  });

  it('respeta excepciones HTTP con texto', () => {
    const respuesta = responder(
      new HttpException('Solicitud no procesable.', 422),
    );
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 422,
      mensaje: 'Solicitud no procesable.',
      errores: ['Solicitud no procesable.'],
    });
  });

  it('mantiene detalles de validación sin exponer el DTO', () => {
    const respuesta = responder(
      new BadRequestException({
        mensaje: 'Datos inválidos.',
        errores: ['Peso inválido.', 'Cliente inválido.'],
      }),
    );
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 400,
      mensaje: 'Datos inválidos.',
      errores: ['Peso inválido.', 'Cliente inválido.'],
    });
  });

  it.each([
    { message: 'Peso inválido.' },
    { message: ['Peso inválido.', 'Cliente inválido.'] },
  ])('normaliza message=$message de NestJS', ({ message }) => {
    const respuesta = responder(new HttpException({ message }, 400));
    const errores = Array.isArray(message) ? message : [message];
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 400,
      mensaje: errores.join(' '),
      errores,
    });
  });

  it('usa el mensaje de la excepción cuando falta el detalle', () => {
    const excepcion = new HttpException({}, 404);
    const respuesta = responder(excepcion);
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 404,
      mensaje: excepcion.message,
      errores: [excepcion.message],
    });
  });

  it.each([
    createHttpError(400, 'Contenido privado.', {
      type: 'entity.parse.failed',
    }),
    createHttpError(413, 'Contenido privado.', {
      type: 'entity.too.large',
    }),
    createHttpError(415, 'Contenido privado.', {
      type: 'charset.unsupported',
    }),
    createHttpError(415, 'Contenido privado.', {
      type: 'encoding.unsupported',
    }),
    createHttpError(400, 'Contenido privado.', {
      code: 'Z_DATA_ERROR',
    }),
  ])('normaliza errores del parser: %j', (error) => {
    const respuesta = responder(error);
    expect(respuesta.status).toHaveBeenCalledWith(error.status);
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: error.status,
      mensaje: expect.any(String),
      errores: [],
    });
    expect(JSON.stringify(respuesta.json.mock.calls)).not.toContain(
      'Contenido privado',
    );
    expect(registrarError).not.toHaveBeenCalled();
  });

  it.each([
    new Error('SECRETO'),
    new HttpException('SECRETO', 500),
    createHttpError(500, 'SECRETO'),
    null,
    { status: 400, message: 'SECRETO' },
    Object.assign(new Error('SECRETO'), {
      type: 'entity.parse.failed',
      status: 500,
    }),
    Object.assign(new Error('SECRETO'), {
      type: 'entity.too.large',
      status: 400,
    }),
    Object.assign(new Error('SECRETO'), { type: 'desconocido', status: 400 }),
  ])('oculta errores inesperados %j y registra la causa', (error) => {
    const respuesta = responder(error);
    expect(respuesta.status).toHaveBeenCalledWith(500);
    expect(respuesta.json).toHaveBeenCalledWith({
      statusCode: 500,
      mensaje: 'Error interno del servidor.',
      errores: [],
    });
    expect(registrarError).toHaveBeenCalled();
  });
});

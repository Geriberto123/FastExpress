import { describe, expect, it, jest } from '@jest/globals';
import { request, response } from 'express';
import createHttpError, { isHttpError } from 'http-errors';
import { normalizarErrorJson } from './normalizar-error-json';

describe('normalizarErrorJson', () => {
  it('conserva el 400 de un error de parseo y oculta sus datos originales', () => {
    const error = createHttpError(400, new SyntaxError('DATO_PRIVADO'), {
      type: 'entity.parse.failed',
      body: 'DATO_PRIVADO',
    });
    const siguiente = jest.fn();
    normalizarErrorJson(error, request, response, siguiente);

    const resultado: unknown = siguiente.mock.calls[0]?.[0];
    expect(isHttpError(resultado)).toBe(true);
    expect(resultado).toMatchObject({ statusCode: 400 });
    expect(resultado).toHaveProperty('message', 'Bad Request');
    expect(resultado).not.toHaveProperty('body');
    expect(resultado).not.toBeInstanceOf(SyntaxError);
    expect(resultado).not.toBe(error);
    expect(JSON.stringify(resultado)).not.toContain('DATO_PRIVADO');
  });

  it.each([
    new SyntaxError('Error de programación, sin estado HTTP.'),
    new Error('Fallo inesperado.'),
    createHttpError(415, 'Charset no admitido.'),
    createHttpError(413, 'Cuerpo demasiado grande.'),
  ])('deja que el filtro clasifique otros errores: %s', (error) => {
    const siguiente = jest.fn();
    normalizarErrorJson(error, request, response, siguiente);
    expect(siguiente.mock.calls[0]?.[0]).toBe(error);
    expect(siguiente).toHaveBeenCalledTimes(1);
  });
});

import { leerConfiguracion } from './configuracion';

describe('leerConfiguracion', () => {
  it('usa configuración local reproducible', () => {
    expect(leerConfiguracion({})).toEqual({
      puerto: 8000,
      origenesCors: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    });
  });

  it('lee el entorno predeterminado', () => {
    const anterior = process.env.PORT;
    try {
      process.env.PORT = '8123';
      expect(leerConfiguracion().puerto).toBe(8123);
    } finally {
      if (anterior === undefined) delete process.env.PORT;
      else process.env.PORT = anterior;
    }
  });

  it('acepta los límites de puerto y normaliza espacios/duplicados', () => {
    expect(
      leerConfiguracion({
        PORT: '1',
        CORS_ORIGINS: ' https://ejemplo.com,https://ejemplo.com ',
      }),
    ).toEqual({ puerto: 1, origenesCors: ['https://ejemplo.com'] });
    expect(leerConfiguracion({ PORT: '65535' }).puerto).toBe(65535);
  });

  it.each([
    '',
    '0',
    '-1',
    '1.5',
    'abc',
    '65536',
    'Infinity',
    ' 8000 ',
    '999999999999999999999999999',
  ])('rechaza PORT=%s', (PORT) => {
    expect(() => leerConfiguracion({ PORT })).toThrow('PORT');
  });

  it.each([
    '',
    '*',
    'null',
    'ftp://ejemplo.com',
    'http://localhost:5500/',
    'https://ejemplo.com/ruta',
    'https://usuario:clave@ejemplo.com',
    'https://ejemplo.com?x=1',
    'https://ejemplo.com,',
  ])('rechaza CORS_ORIGINS=%s', (CORS_ORIGINS) => {
    expect(() => leerConfiguracion({ CORS_ORIGINS })).toThrow('CORS_ORIGINS');
  });
});

import type { EntradaCotizacion } from './cotizacion';
import { TipoCliente, TipoEnvio } from './reglas-tarifa';
import { CotizacionInvalidaError, validarEntrada } from './validar-entrada';

describe('validarEntrada (invariantes del dominio)', () => {
  const valida = {
    peso: 5,
    tipoCliente: TipoCliente.NUEVO,
    tipoEnvio: TipoEnvio.ESTANDAR,
  };

  it.each([
    [{ peso: NaN }, 'número finito'],
    [{ peso: Infinity }, 'número finito'],
    [{ peso: -Infinity }, 'número finito'],
    [{ peso: '5' }, 'número finito'],
    [{ peso: null }, 'número finito'],
    [{ peso: true }, 'número finito'],
    [{ peso: undefined }, 'número finito'],
    [{ peso: 5.001 }, 'máximo 2 decimales'],
    [{ peso: 0.001 }, 'máximo 2 decimales'],
    [{ peso: 0 }, 'mínimo'],
    [{ peso: -1 }, 'mínimo'],
    [{ peso: 20.01 }, 'Límite excedido'],
    [{ tipoCliente: 'toString' }, 'cliente'],
    [{ tipoCliente: '__proto__' }, 'cliente'],
    [{ tipoCliente: 'vip' }, 'cliente'],
    [{ tipoEnvio: 'URGENTE' }, 'envío'],
  ])('rechaza %j con mensaje %s', (cambio: any, mensaje: any) => {
    const entrada = { ...valida, ...cambio } as unknown as EntradaCotizacion;
    expect(() => validarEntrada(entrada)).toThrow(CotizacionInvalidaError);
    expect(() => validarEntrada(entrada)).toThrow(mensaje);
  });

  it('acepta un peso representado en notación exponencial que equivale a 0.01', () => {
    expect(() => validarEntrada({ ...valida, peso: 1e-2 })).not.toThrow();
  });
});

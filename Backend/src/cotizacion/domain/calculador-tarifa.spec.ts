import Decimal from 'decimal.js';
import {
  CASOS_DECISION,
  CASOS_FRONTERA_VALIDOS,
} from '../../../test/fixtures/cotizaciones';
import { CalculadorTarifaDecimal } from './calculador-tarifa';
import { TipoCliente, TipoEnvio } from './reglas-tarifa';
import { CotizacionInvalidaError } from './validar-entrada';

describe('CalculadorTarifaDecimal', () => {
  const calculador = new CalculadorTarifaDecimal();

  it.each(CASOS_DECISION)(
    'peso=$peso cliente=$tipoCliente envío=$tipoEnvio → USD $total',
    ({ peso, tipoCliente, tipoEnvio, descuento, recargo, total }) => {
      const resultado = calculador.calcular({ peso, tipoCliente, tipoEnvio });
      expect(resultado.base.toFixed(2)).toBe('5.00');
      expect(resultado.descuento.equals(descuento)).toBe(true);
      expect(resultado.recargo.equals(recargo)).toBe(true);
      expect(resultado.total.equals(total)).toBe(true);
      expect(
        resultado.base
          .plus(resultado.costoPeso)
          .minus(resultado.descuento)
          .plus(resultado.recargo)
          .equals(resultado.total),
      ).toBe(true);
      expect(Object.isFrozen(resultado)).toBe(true);
    },
  );

  it.each(CASOS_FRONTERA_VALIDOS)(
    'frontera válida: $peso kg',
    ({ peso, costoPeso, total }) => {
      const resultado = calculador.calcular({
        peso,
        tipoCliente: TipoCliente.NUEVO,
        tipoEnvio: TipoEnvio.ESTANDAR,
      });
      expect(resultado.costoPeso.equals(costoPeso)).toBe(true);
      expect(resultado.total.equals(total)).toBe(true);
    },
  );

  it.each([0, -1, 20.01])(
    'rechaza la frontera inválida %s kg',
    (peso: number) => {
      expect(() =>
        calculador.calcular({
          peso,
          tipoCliente: TipoCliente.NUEVO,
          tipoEnvio: TipoEnvio.ESTANDAR,
        }),
      ).toThrow(CotizacionInvalidaError);
    },
  );

  it.each([
    {
      peso: 0.01,
      tipoCliente: TipoCliente.VIP,
      tipoEnvio: TipoEnvio.EXPRESS,
      descuento: '1.00',
      recargo: '1.26',
      total: '5.28',
    },
    {
      peso: 0.03,
      tipoCliente: TipoCliente.FRECUENTE,
      tipoEnvio: TipoEnvio.ESTANDAR,
      descuento: '0.51',
      recargo: '0.00',
      total: '4.55',
    },
    {
      peso: 0.05,
      tipoCliente: TipoCliente.VIP,
      tipoEnvio: TipoEnvio.EXPRESS,
      descuento: '1.02',
      recargo: '1.28',
      total: '5.36',
    },
    {
      peso: 5.01,
      tipoCliente: TipoCliente.VIP,
      tipoEnvio: TipoEnvio.EXPRESS,
      descuento: '5.01',
      recargo: '6.26',
      total: '26.29',
    },
  ])('redondea cada importe: $peso/$tipoCliente/$tipoEnvio', (caso) => {
    const resultado = calculador.calcular(caso);
    expect(resultado.descuento.toFixed(2)).toBe(caso.descuento);
    expect(resultado.recargo.toFixed(2)).toBe(caso.recargo);
    expect(resultado.total.toFixed(2)).toBe(caso.total);
  });

  it('conserva el redondeo aprobado ante cambios globales de Decimal', () => {
    const anterior = Decimal.rounding;
    try {
      Decimal.set({ rounding: Decimal.ROUND_DOWN });
      const resultado = calculador.calcular({
        peso: 0.01,
        tipoCliente: TipoCliente.VIP,
        tipoEnvio: TipoEnvio.EXPRESS,
      });
      expect(resultado.recargo.toFixed(2)).toBe('1.26');
    } finally {
      Decimal.set({ rounding: anterior });
    }
  });

  it.each([
    {
      peso: 0.01,
      tipoCliente: TipoCliente.VIP,
      tipoEnvio: TipoEnvio.ESTANDAR,
      total: '4.02',
    },
    {
      peso: 0.02,
      tipoCliente: TipoCliente.VIP,
      tipoEnvio: TipoEnvio.ESTANDAR,
      total: '4.03',
    },
    {
      peso: 19.99,
      tipoCliente: TipoCliente.NUEVO,
      tipoEnvio: TipoEnvio.EXPRESS,
      total: '106.20',
    },
    {
      peso: 20,
      tipoCliente: TipoCliente.NUEVO,
      tipoEnvio: TipoEnvio.EXPRESS,
      total: '106.25',
    },
  ])(
    'verifica límite de monto $total para $peso/$tipoCliente/$tipoEnvio',
    (caso) => {
      expect(calculador.calcular(caso).total.toFixed(2)).toBe(caso.total);
    },
  );

  it.each([
    ['CP-306', '4.01'],
    ['CP-307', '106.26'],
  ])(
    '%s demuestra que el total %s no es alcanzable con entradas válidas',
    (_id, totalNoAlcanzable) => {
      const totales = new Set<string>();
      for (let centesimas = 1; centesimas <= 2000; centesimas += 1) {
        const peso = centesimas / 100;
        for (const tipoCliente of Object.values(TipoCliente)) {
          for (const tipoEnvio of Object.values(TipoEnvio)) {
            totales.add(
              calculador
                .calcular({ peso, tipoCliente, tipoEnvio })
                .total.toFixed(2),
            );
          }
        }
      }
      expect(totales).not.toContain(totalNoAlcanzable);
    },
  );
});

import Decimal from 'decimal.js';
import type {
  CalculadorTarifa,
  Cotizacion,
  EntradaCotizacion,
} from './cotizacion';
import { DESCUENTOS, RECARGOS, REGLAS_TARIFA } from './reglas-tarifa';
import { validarEntrada } from './validar-entrada';

// Constructor local: no depende de cambios a la configuración global de Decimal.
const Dinero = Decimal.clone({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
});

export class CalculadorTarifaDecimal implements CalculadorTarifa {
  calcular(entrada: EntradaCotizacion): Cotizacion {
    validarEntrada(entrada);

    const base = new Dinero(REGLAS_TARIFA.base);
    const tarifaPorKg =
      entrada.peso <= REGLAS_TARIFA.limitePrimerTramo
        ? REGLAS_TARIFA.tarifaPrimerTramo
        : REGLAS_TARIFA.tarifaSegundoTramo;
    const costoPeso = new Dinero(entrada.peso).times(tarifaPorKg);
    const subtotal = base.plus(costoPeso);
    const descuento = subtotal
      .times(DESCUENTOS[entrada.tipoCliente])
      .toDecimalPlaces(2);
    const recargo = subtotal
      .times(RECARGOS[entrada.tipoEnvio])
      .toDecimalPlaces(2);
    const total = subtotal.minus(descuento).plus(recargo);

    return Object.freeze({ base, costoPeso, descuento, recargo, total });
  }
}

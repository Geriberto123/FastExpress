import Decimal from 'decimal.js';
import type { EntradaCotizacion } from './cotizacion';
import { DESCUENTOS, RECARGOS, REGLAS_TARIFA } from './reglas-tarifa';

export class CotizacionInvalidaError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = 'CotizacionInvalidaError';
  }
}

export function validarEntrada(entrada: EntradaCotizacion): void {
  if (!Number.isFinite(entrada.peso)) {
    throw new CotizacionInvalidaError('El peso debe ser un número finito.');
  }

  const peso = new Decimal(entrada.peso);
  if (peso.decimalPlaces() > REGLAS_TARIFA.decimalesPeso) {
    throw new CotizacionInvalidaError('El peso admite máximo 2 decimales.');
  }
  if (peso.lessThan(REGLAS_TARIFA.pesoMinimo)) {
    throw new CotizacionInvalidaError('El peso mínimo es 0.01 kg.');
  }
  if (peso.greaterThan(REGLAS_TARIFA.pesoMaximo)) {
    throw new CotizacionInvalidaError(
      'Límite excedido: el peso máximo es 20 kg.',
    );
  }
  if (!Object.hasOwn(DESCUENTOS, entrada.tipoCliente)) {
    throw new CotizacionInvalidaError('Tipo de cliente no válido.');
  }
  if (!Object.hasOwn(RECARGOS, entrada.tipoEnvio)) {
    throw new CotizacionInvalidaError('Tipo de envío no válido.');
  }
}

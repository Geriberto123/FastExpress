import type Decimal from 'decimal.js';
import type { TipoCliente, TipoEnvio } from './reglas-tarifa';

export interface EntradaCotizacion {
  readonly peso: number;
  readonly tipoCliente: TipoCliente;
  readonly tipoEnvio: TipoEnvio;
}

export interface Cotizacion {
  readonly base: Decimal;
  readonly costoPeso: Decimal;
  readonly descuento: Decimal;
  readonly recargo: Decimal;
  readonly total: Decimal;
}

export interface CalculadorTarifa {
  calcular(entrada: EntradaCotizacion): Cotizacion;
}

export const CALCULADOR_TARIFA = Symbol('CALCULADOR_TARIFA');

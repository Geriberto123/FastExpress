import { Inject, Injectable } from '@nestjs/common';
import { CALCULADOR_TARIFA } from '../domain/cotizacion';
import type {
  CalculadorTarifa,
  Cotizacion,
  EntradaCotizacion,
} from '../domain/cotizacion';

@Injectable()
export class CotizarService {
  constructor(
    @Inject(CALCULADOR_TARIFA) private readonly calculador: CalculadorTarifa,
  ) {}

  cotizar(entrada: EntradaCotizacion): Cotizacion {
    return this.calculador.calcular(entrada);
  }
}

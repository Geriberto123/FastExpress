import { ApiProperty } from '@nestjs/swagger';
import type { Cotizacion } from '../domain/cotizacion';

export class CotizacionRespuestaDto {
  @ApiProperty({ example: 5 })
  base!: number;

  @ApiProperty({ example: 10 })
  costoPeso!: number;

  @ApiProperty({ example: 3 })
  descuento!: number;

  @ApiProperty({ example: 3.75 })
  recargo!: number;

  @ApiProperty({ example: 15.75 })
  total!: number;

  static desde(cotizacion: Cotizacion): CotizacionRespuestaDto {
    return {
      base: cotizacion.base.toNumber(),
      costoPeso: cotizacion.costoPeso.toNumber(),
      descuento: cotizacion.descuento.toNumber(),
      recargo: cotizacion.recargo.toNumber(),
      total: cotizacion.total.toNumber(),
    };
  }
}

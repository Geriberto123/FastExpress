import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, Max, Min } from 'class-validator';
import { REGLAS_TARIFA, TipoCliente, TipoEnvio } from '../domain/reglas-tarifa';
import type { EntradaCotizacion } from '../domain/cotizacion';

export class CotizarDto implements EntradaCotizacion {
  @ApiProperty({
    example: 5,
    minimum: REGLAS_TARIFA.pesoMinimo,
    maximum: REGLAS_TARIFA.pesoMaximo,
    multipleOf: 0.01,
    description: 'Peso numérico en kg, con máximo dos decimales.',
  })
  @IsNumber(
    {
      maxDecimalPlaces: REGLAS_TARIFA.decimalesPeso,
      allowInfinity: false,
      allowNaN: false,
    },
    { message: 'El peso debe ser un número finito con máximo 2 decimales.' },
  )
  @Min(REGLAS_TARIFA.pesoMinimo, { message: 'El peso mínimo es 0.01 kg.' })
  @Max(REGLAS_TARIFA.pesoMaximo, {
    message: 'Límite excedido: el peso máximo es 20 kg.',
  })
  peso!: number;

  @ApiProperty({ enum: TipoCliente, example: TipoCliente.VIP })
  @IsEnum(TipoCliente, { message: 'Tipo de cliente no válido.' })
  tipoCliente!: TipoCliente;

  @ApiProperty({ enum: TipoEnvio, example: TipoEnvio.EXPRESS })
  @IsEnum(TipoEnvio, { message: 'Tipo de envío no válido.' })
  tipoEnvio!: TipoEnvio;
}

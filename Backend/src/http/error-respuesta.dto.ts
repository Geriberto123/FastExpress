import { ApiProperty } from '@nestjs/swagger';

export class ErrorRespuestaDto {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({ example: 'La solicitud contiene datos inválidos.' })
  mensaje!: string;

  @ApiProperty({ type: [String], example: ['El peso mínimo es 0.01 kg.'] })
  errores!: string[];
}

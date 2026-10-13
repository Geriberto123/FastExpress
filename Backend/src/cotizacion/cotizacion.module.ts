import { Module } from '@nestjs/common';
import { CotizarService } from './application/cotizar.service';
import { CALCULADOR_TARIFA } from './domain/cotizacion';
import { CalculadorTarifaDecimal } from './domain/calculador-tarifa';
import { CotizacionController } from './http/cotizacion.controller';

@Module({
  controllers: [CotizacionController],
  providers: [
    CotizarService,
    { provide: CALCULADOR_TARIFA, useClass: CalculadorTarifaDecimal },
  ],
})
export class CotizacionModule {}

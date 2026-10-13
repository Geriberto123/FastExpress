import { Module } from '@nestjs/common';
import { CotizacionModule } from './cotizacion/cotizacion.module';
import { HealthController } from './health.controller';

@Module({ imports: [CotizacionModule], controllers: [HealthController] })
export class AppModule {}

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiPayloadTooLargeResponse,
  ApiTags,
  ApiUnsupportedMediaTypeResponse,
} from '@nestjs/swagger';
import { CotizarService } from '../application/cotizar.service';
import { ErrorRespuestaDto } from '../../http/error-respuesta.dto';
import { CotizacionRespuestaDto } from './cotizacion-respuesta.dto';
import { CotizarDto } from './cotizar.dto';

@ApiTags('Cotización')
@Controller('cotizar')
export class CotizacionController {
  constructor(private readonly servicio: CotizarService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cotizar un envío en USD sin persistirlo' })
  @ApiOkResponse({ type: CotizacionRespuestaDto })
  @ApiBadRequestResponse({ type: ErrorRespuestaDto })
  @ApiPayloadTooLargeResponse({ type: ErrorRespuestaDto })
  @ApiUnsupportedMediaTypeResponse({ type: ErrorRespuestaDto })
  @ApiInternalServerErrorResponse({ type: ErrorRespuestaDto })
  cotizar(@Body() entrada: CotizarDto): CotizacionRespuestaDto {
    return CotizacionRespuestaDto.desde(this.servicio.cotizar(entrada));
  }
}

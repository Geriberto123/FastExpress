import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { isHttpError } from 'http-errors';
import { CotizacionInvalidaError } from '../cotizacion/domain/validar-entrada';
import type { ErrorRespuestaDto } from './error-respuesta.dto';

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpErrorFilter.name);

  catch(excepcion: unknown, host: ArgumentsHost): void {
    const respuesta = host.switchToHttp().getResponse<Response>();
    const cuerpo = this.cuerpoDe(excepcion);
    respuesta.status(cuerpo.statusCode).json(cuerpo);
  }

  private statusDe(excepcion: unknown): number {
    if (excepcion instanceof CotizacionInvalidaError) {
      return HttpStatus.BAD_REQUEST;
    }
    if (excepcion instanceof HttpException) {
      return excepcion.getStatus();
    }
    if (isHttpError(excepcion)) {
      return excepcion.statusCode;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private cuerpoDe(excepcion: unknown): ErrorRespuestaDto {
    const statusCode = this.statusDe(excepcion);
    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        'Error inesperado al procesar la solicitud.',
        excepcion,
      );
      return {
        statusCode,
        mensaje: 'Error interno del servidor.',
        errores: [],
      };
    }
    if (excepcion instanceof CotizacionInvalidaError) {
      return {
        statusCode,
        mensaje: excepcion.message,
        errores: [excepcion.message],
      };
    }
    if (excepcion instanceof HttpException) {
      const contenido = excepcion.getResponse();
      if (typeof contenido === 'string') {
        return { statusCode, mensaje: contenido, errores: [contenido] };
      }
      const detalles = contenido as Partial<ErrorRespuestaDto> & {
        message?: string | string[];
      };
      const mensajes =
        detalles.errores ?? detalles.message ?? excepcion.message;
      const errores = Array.isArray(mensajes) ? mensajes : [mensajes];
      return {
        statusCode,
        mensaje: detalles.mensaje ?? errores.join(' '),
        errores,
      };
    }
    if (statusCode === HttpStatus.PAYLOAD_TOO_LARGE) {
      return {
        statusCode,
        mensaje: 'El cuerpo JSON excede el límite de 16 KiB.',
        errores: [],
      };
    }
    if (statusCode === HttpStatus.UNSUPPORTED_MEDIA_TYPE) {
      return {
        statusCode,
        mensaje:
          'La codificación o el charset del cuerpo JSON no está admitido.',
        errores: [],
      };
    }
    return {
      statusCode,
      mensaje: 'El cuerpo de la solicitud no contiene JSON válido.',
      errores: [],
    };
  }
}

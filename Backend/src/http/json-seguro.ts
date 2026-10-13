// class-transformer omite estas claves antes de validar el DTO.
// Rechazarlas durante el parseo impide aceptarlas silenciosamente.
export function rechazarClavesReservadas(
  clave: string,
  valor: unknown,
): unknown {
  if (['__proto__', 'constructor', 'prototype'].includes(clave)) {
    throw new SyntaxError('El JSON contiene un campo reservado no permitido.');
  }
  return valor;
}

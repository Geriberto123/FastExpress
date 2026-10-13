export enum TipoCliente {
  NUEVO = 'NUEVO',
  FRECUENTE = 'FRECUENTE',
  VIP = 'VIP',
}

export enum TipoEnvio {
  ESTANDAR = 'ESTANDAR',
  EXPRESS = 'EXPRESS',
}

export const REGLAS_TARIFA = Object.freeze({
  pesoMinimo: 0.01,
  pesoMaximo: 20,
  decimalesPeso: 2,
  limitePrimerTramo: 5,
  base: '5.00',
  tarifaPrimerTramo: '2.00',
  tarifaSegundoTramo: '4.00',
});

export const DESCUENTOS: Readonly<Record<TipoCliente, string>> = Object.freeze({
  [TipoCliente.NUEVO]: '0',
  [TipoCliente.FRECUENTE]: '0.10',
  [TipoCliente.VIP]: '0.20',
});

export const RECARGOS: Readonly<Record<TipoEnvio, string>> = Object.freeze({
  [TipoEnvio.ESTANDAR]: '0',
  [TipoEnvio.EXPRESS]: '0.25',
});

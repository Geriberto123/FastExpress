export interface Configuracion {
  readonly puerto: number;
  readonly origenesCors: readonly string[];
}

const ORIGENES_LOCALES = 'http://localhost:5500,http://127.0.0.1:5500';

export function leerConfiguracion(
  entorno: NodeJS.ProcessEnv = process.env,
): Configuracion {
  const textoPuerto = entorno.PORT ?? '8000';
  if (!/^[1-9]\d*$/.test(textoPuerto)) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }
  const puerto = Number(textoPuerto);
  if (puerto > 65535) {
    throw new Error('PORT debe ser un entero entre 1 y 65535.');
  }

  const origenesCors = (entorno.CORS_ORIGINS ?? ORIGENES_LOCALES)
    .split(',')
    .map((origen) => origen.trim());
  for (const origen of origenesCors) {
    validarOrigen(origen);
  }

  return Object.freeze({
    puerto,
    origenesCors: Object.freeze([...new Set(origenesCors)]),
  });
}

function validarOrigen(origen: string): void {
  let url: URL;
  try {
    url = new URL(origen);
  } catch {
    throw new Error('CORS_ORIGINS debe contener orígenes HTTP(S) válidos.');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origen) {
    throw new Error(
      'CORS_ORIGINS solo admite orígenes HTTP(S) sin rutas, credenciales ni comodines.',
    );
  }
}

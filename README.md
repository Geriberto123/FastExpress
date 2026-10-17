# FastExpress

Proyecto integrador de **Calidad de Software** para cotizar envíos, descuentos y recargos.

## Inicio rápido

Requisitos: Node.js 24.9 o posterior dentro de la versión 24 y npm. Abre dos terminales desde la raíz del repositorio.

### 1. Instalar dependencias

```sh
npm ci --prefix Backend
npm ci --prefix Frontend
```

La primera vez que ejecutes las pruebas de interfaz, instala Chromium:

```sh
cd Frontend && npx playwright install chromium
```

### 2. Iniciar el backend

En la primera terminal:

```sh
cd Backend
npm run build
CORS_ORIGINS=http://127.0.0.1:5501,http://localhost:5501 PORT=8000 npm start
```

El backend queda disponible en `http://localhost:8000`. Puedes verificarlo en `http://localhost:8000/api/health`.

### 3. Iniciar el frontend

En la segunda terminal:

```sh
cd Frontend
node scripts/static-server.cjs
```

Abre **http://127.0.0.1:5501** en el navegador y prueba el cotizador. Usa esa dirección exacta; `localhost` y `127.0.0.1` son orígenes distintos para CORS.

Para detener cada servidor, vuelve a su terminal y presiona **Ctrl+C**. Si aparece `EADDRINUSE`, ese puerto ya está ocupado por otro proceso: reutiliza el servidor que ya está ejecutándose o detén ese proceso antes de volver a iniciarlo.

## Validar calidad (QA)

Ejecuta estos comandos desde la raíz. Las pruebas de interfaz inician sus propios servidores en los puertos 5501 y 8000; detén cualquier servidor manual antes de correrlas.

```sh
npm --prefix Backend run lint
npm --prefix Backend run typecheck
npm --prefix Backend test
npm --prefix Backend run test:cov
npm --prefix Backend run build
npm --prefix Frontend run test:unit
npm --prefix Frontend run test:ui
```

Playwright ejecuta los casos de interfaz contra la aplicación y el backend. Al terminar, el reporte de cobertura del backend queda en `Backend/coverage/index.html`.

### Prueba de rendimiento opcional

Inicia el backend compilado en el puerto 8001:

```sh
cd Backend
npm run build
PORT=8001 npm start
```

En otra terminal, desde la raíz:

```sh
FASTEXPRESS_URL=http://127.0.0.1:8001/api/cotizar CONCURRENCY=50 node tests/performance/cotizacion-local.mjs
```

## Documentación

- [Guía y contrato de la API](Backend/README.md)
- [Informe de QA](docs/informe_qa.md)

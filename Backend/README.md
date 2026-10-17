# FastExpress — Backend

API de cotización de envíos con NestJS, TypeScript y Express. Requiere **Node.js 24.9 o posterior dentro de la versión 24** y npm.

## Ejecutar

Requiere Node.js 24.9 o posterior dentro de la versión 24 y npm. Instala las dependencias desde `Backend/`:

```bash
npm ci
```

Para trabajar localmente con el frontend, desde `Backend/` ejecuta:

```bash
npm run build
CORS_ORIGINS=http://127.0.0.1:5501,http://localhost:5501 PORT=8000 npm start
```

La API queda disponible en `http://localhost:8000`; comprueba que está activa en `http://localhost:8000/api/health`. En otra terminal, inicia el frontend con `cd Frontend && node scripts/static-server.cjs` y abre `http://127.0.0.1:5501`.

También puedes iniciar el backend en modo desarrollo con `CORS_ORIGINS=http://127.0.0.1:5501,http://localhost:5501 npm run start:dev`. Para usarlo sin el frontend, `npm run start:dev` utiliza los valores predeterminados.

Variables opcionales: `PORT` (predeterminado: `8000`) y `CORS_ORIGINS` (predeterminado: `http://localhost:5500,http://127.0.0.1:5500`). Los orígenes se separan por comas, sin rutas ni comodines. `localhost` y `127.0.0.1` son orígenes distintos; permite el origen exacto desde el que abriste el frontend. Para detener el servidor, usa `Ctrl+C` en su terminal.

## API

- `POST /api/cotizar`: cotización en USD; respuesta 200.
- `GET /api/health`: estado del servidor.
- `/api/docs/`: Swagger con el contrato y ejemplos.

```bash
curl http://localhost:8000/api/cotizar -H 'Content-Type: application/json' -d '{"peso":5,"tipoCliente":"VIP","tipoEnvio":"EXPRESS"}'
```

```json
{
  "base": 5,
  "costoPeso": 10,
  "descuento": 3,
  "recargo": 3.75,
  "total": 15.75
}
```

Peso: número entre 0.01 y 20 kg, máximo dos decimales. Clientes: `NUEVO`, `FRECUENTE`, `VIP`. Envíos: `ESTANDAR`, `EXPRESS`. Los campos son obligatorios; se rechazan cadenas numéricas y campos adicionales.

Base USD 5; tarifa USD 2/kg hasta 5 kg y USD 4/kg entre 5.01 y 20 kg, aplicada al peso completo. Descuentos 0/10/20 % y recargo EXPRESS 25 % sobre el subtotal original. Cada ajuste se redondea a centavos con mitades hacia arriba.

Errores: 400 para entradas inválidas, 413 para JSON mayor a 16 KiB, 500 para fallos internos. Contrato: `{ statusCode, mensaje, errores }`.

## Verificaciones y QA

Desde `Backend/`:

```bash
npm run lint
npm run typecheck
npm run build
npm test
npm run test:cov
```

El reporte generado se abre en `coverage/index.html`. Se exige 85 % de líneas y ramas global y 100 % del calculador. GitHub Actions ejecuta las verificaciones y conserva la cobertura como artefacto. `coverage/` está ignorado por Git y se regenera con `npm run test:cov`.

Para ejecutar las pruebas del frontend, instala sus dependencias con `cd ../Frontend && npm ci`; la primera vez instala Chromium con `npx playwright install chromium`. Luego ejecuta `npm run test:unit` y `npm run test:ui` desde `Frontend/`. Las pruebas de interfaz levantan automáticamente sus propios servidores en los puertos 5501 y 8000, así que detén los servidores manuales antes de iniciarlas para evitar `EADDRINUSE`.

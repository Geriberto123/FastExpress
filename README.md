# FastExpress

Proyecto integrador de **Calidad de Software**: cotización de envíos, descuentos y recargos.

- [Backend: instalación y uso de la API](Backend/README.md).

El backend usa NestJS/TypeScript y expone `POST http://localhost:8000/api/cotizar`. El frontend está en `Frontend/` y su conexión a la API corresponde al responsable frontend.

## Verificación QA

```sh
cd Backend && npm ci && npm test -- --coverage --coverageDirectory ../docs/evidencias/coverage
cd Backend && npm run lint && npm run typecheck
cd Frontend && npm ci && npx playwright install chromium
cd Frontend && npm run test:unit && npm run test:ui
cd Backend && npm run build && PORT=8001 npm start
# En otra terminal, desde la raíz:
FASTEXPRESS_URL=http://127.0.0.1:8001/api/cotizar CONCURRENCY=50 node tests/performance/cotizacion-local.mjs
# Conversión del informe cuando Pandoc esté instalado:
pandoc docs/informe_qa.md -o docs/Informe_QA_FastExpress.docx
```

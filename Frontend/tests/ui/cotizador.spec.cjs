const { test, expect } = require('@playwright/test');

async function cotizar(page, peso, cliente = 'NUEVO', envio = 'ESTANDAR') {
  await page.locator('#peso').fill(peso);
  await page.locator('#tipoCliente').selectOption(cliente);
  await page.locator('#tipoEnvio').selectOption(envio);
  await page.locator('#btn-cotizar').click();
}

test('UI-01 carga únicamente el formulario', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#form-cotizacion')).toBeVisible();
  await expect(page.locator('#mensaje-error')).toBeHidden();
  await expect(page.locator('#cargando')).toBeHidden();
  await expect(page.locator('#resultado')).toBeHidden();
});

test('UI-02 muestra los tres errores al cotizar vacío', async ({ page }) => {
  await page.goto('/');
  await page.locator('#btn-cotizar').click();
  await expect(page.locator('#error-peso')).toHaveText('El peso es obligatorio.');
  await expect(page.locator('#error-tipoCliente')).toHaveText('Seleccione un tipo de cliente.');
  await expect(page.locator('#error-tipoEnvio')).toHaveText('Seleccione un tipo de envío.');
});

test('UI-03 presenta los importes numéricos en cero', async ({ page }) => {
  await page.route('http://localhost:8000/api/cotizar', route => route.fulfill({ json: { base: 5, costoPeso: 4, descuento: 0, recargo: 0, total: 9 } }));
  await page.goto('/');
  await cotizar(page, '2');
  await expect(page.locator('#res-descuento')).toContainText('0.00');
  await expect(page.locator('#res-recargo')).toContainText('0.00');
});

test('UI-04 oculta un resultado previo mientras inicia una nueva cotización', async ({ page }) => {
  let resolver;
  await page.route('http://localhost:8000/api/cotizar', route => {
    if (!resolver) return route.fulfill({ json: { base: 5, costoPeso: 4, descuento: 0, recargo: 0, total: 9 } });
    return resolver(route);
  });
  await page.goto('/');
  await cotizar(page, '2');
  await expect(page.locator('#resultado')).toBeVisible();
  const pendiente = new Promise(resolve => {
    resolver = async route => {
      await new Promise(done => setTimeout(done, 150));
      await route.fulfill({ json: { base: 5, costoPeso: 6, descuento: 0, recargo: 0, total: 11 } });
      resolve();
    };
  });
  await cotizar(page, '3');
  await expect(page.locator('#resultado')).toBeHidden();
  await pendiente;
  await expect(page.locator('#res-total')).toHaveText('$11.00');
});

test('UI-05 doble clic genera una sola petición', async ({ page }) => {
  let solicitudes = 0;
  await page.route('http://localhost:8000/api/cotizar', async route => {
    solicitudes += 1;
    await new Promise(resolve => setTimeout(resolve, 100));
    await route.fulfill({ json: { base: 5, costoPeso: 4, descuento: 0, recargo: 0, total: 9 } });
  });
  await page.goto('/');
  await page.locator('#peso').fill('2');
  await page.locator('#tipoCliente').selectOption('NUEVO');
  await page.locator('#tipoEnvio').selectOption('ESTANDAR');
  await page.locator('#btn-cotizar').dblclick();
  await expect(page.locator('#resultado')).toBeVisible();
  expect(solicitudes).toBe(1);
});

test('UI-06 comunica que el backend no está disponible', async ({ page }) => {
  await page.route('http://localhost:8000/api/cotizar', route => route.abort('failed'));
  await page.goto('/');
  await cotizar(page, '2');
  await expect(page.locator('#mensaje-error')).toHaveText('No se pudo conectar con el servidor. Intente de nuevo.');
});

test('UI-07 no desborda horizontalmente a 375 px', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('UI-08 acepta coma y muestra el total de la API', async ({ page }) => {
  await page.route('http://localhost:8000/api/cotizar', route => route.fulfill({ json: { base: 5, costoPeso: 30, descuento: 0, recargo: 0, total: 35 } }));
  await page.goto('/');
  await cotizar(page, ' 7,5 ');
  await expect(page.locator('#res-total')).toHaveText('$35.00');
});

test('UI-08 reproduce BVA y tabla de decisión devueltas por la API', async ({ page }) => {
  const totales = new Map([
    ['0.01|NUEVO|ESTANDAR', 5.02], ['0.02|NUEVO|ESTANDAR', 5.04],
    ['4.99|NUEVO|ESTANDAR', 14.98], ['5|NUEVO|ESTANDAR', 15],
    ['5.01|NUEVO|ESTANDAR', 25.04], ['5.02|NUEVO|ESTANDAR', 25.08],
    ['19.99|NUEVO|ESTANDAR', 84.96], ['20|NUEVO|ESTANDAR', 85],
    ['2|NUEVO|EXPRESS', 11.25], ['2|FRECUENTE|ESTANDAR', 8.1],
    ['2|FRECUENTE|EXPRESS', 10.35], ['2|VIP|ESTANDAR', 7.2], ['2|VIP|EXPRESS', 9.45],
  ]);
  await page.route('http://localhost:8000/api/cotizar', route => {
    const datos = route.request().postDataJSON();
    const total = totales.get(`${datos.peso}|${datos.tipoCliente}|${datos.tipoEnvio}`);
    return route.fulfill({ json: { base: 5, costoPeso: 0, descuento: 0, recargo: 0, total } });
  });
  await page.goto('/');
  for (const [clave, total] of totales) {
    const [peso, cliente, envio] = clave.split('|');
    await cotizar(page, peso, cliente, envio);
    await expect(page.locator('#res-total')).toHaveText(`$${total.toFixed(2)}`);
  }
});

test('UI-08 contra backend real: BVA, decisión y redondeo', async ({ page }) => {
  await page.goto('/');
  for (const [peso, cliente, envio, total] of [
    ['0.01', 'NUEVO', 'ESTANDAR', '5.02'], ['5.00', 'NUEVO', 'ESTANDAR', '15.00'],
    ['5.01', 'NUEVO', 'ESTANDAR', '25.04'], ['20.00', 'NUEVO', 'ESTANDAR', '85.00'],
    ['2.00', 'FRECUENTE', 'EXPRESS', '10.35'], ['2.00', 'VIP', 'EXPRESS', '9.45'],
    ['0.03', 'NUEVO', 'EXPRESS', '6.33'],
  ]) {
    await cotizar(page, peso, cliente, envio);
    await expect(page.locator('#res-total')).toHaveText(`$${total}`);
  }
});

test('UI-09 carga los recursos locales sin respuestas 4xx ni 5xx', async ({ page }) => {
  const errores = [];
  page.on('response', respuesta => {
    const url = new URL(respuesta.url());
    if (url.host === 'localhost:5501' && respuesta.status() >= 400) {
      errores.push(`${respuesta.status()} ${url.pathname}`);
    }
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(errores).toEqual([]);
});

const url = process.env.FASTEXPRESS_URL ?? 'http://127.0.0.1:8000/api/cotizar';
const concurrentes = Number(process.env.CONCURRENCY ?? 50);
const inicio = performance.now();

const resultados = await Promise.all(Array.from({ length: concurrentes }, async () => {
  const comienzo = performance.now();
  try {
    const respuesta = await fetch(url, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ peso: 2, tipoCliente: 'VIP', tipoEnvio: 'EXPRESS' }),
    });
    return { ms: performance.now() - comienzo, error5xx: respuesta.status >= 500, ok: respuesta.ok };
  } catch {
    return { ms: performance.now() - comienzo, error5xx: true, ok: false };
  }
}));
const latencias = resultados.map(resultado => resultado.ms).sort((a, b) => a - b);
const percentil = p => latencias[Math.ceil(latencias.length * p) - 1];
console.log(JSON.stringify({
  concurrentes, exitosas: resultados.filter(resultado => resultado.ok).length,
  errores5xx: resultados.filter(resultado => resultado.error5xx).length,
  p50Ms: Number(percentil(0.5).toFixed(2)), p95Ms: Number(percentil(0.95).toFixed(2)),
  tiempoTotalMs: Number((performance.now() - inicio).toFixed(2)),
}, null, 2));

const USAR_MOCK = true; // Esta toca cambiarla a false cuando el backend esté listo
const URL_API = "http://localhost:8000/api/cotizar"; // Ajustar a la URL de verdad cuanto se cree

async function cotizarEnvio(datos) {
  return USAR_MOCK ? cotizarMock(datos) : cotizarReal(datos);
}

// El modo Real del negocio
async function cotizarReal(datos) {
  let respuesta;

  try {
    respuesta = await fetch(URL_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
  } catch (e) {
    throw new Error("No se pudo conectar con el servidor. Intente de nuevo.");
  }

  if (!respuesta.ok) {
    let mensaje = "Error del servidor (" + respuesta.status + ").";
    try {
      const cuerpo = await respuesta.json();

      mensaje = cuerpo.mensaje || cuerpo.error || mensaje;
    } catch (e) {
      
    }
    throw new Error(mensaje);
  }

  return respuesta.json();
}

// Mock Up para desarrollo, simula el backend para poder probar la interfaz simplemente.
async function cotizarMock(datos) {
  await new Promise((resolver) => setTimeout(resolver, 600)); // simula latencia

  const { peso, tipoCliente, tipoEnvio } = datos;

  if (peso > 20) {
    throw new Error("Límite excedido: el peso máximo es 20 kg.");
  }

  const base = 5;
  const costoPeso = peso <= 5 ? peso * 2 : peso * 4;
  const subtotal = base + costoPeso;

  const porcentajeDescuento = { NUEVO: 0, FRECUENTE: 0.1, VIP: 0.2 }[tipoCliente];
  const descuento = subtotal * porcentajeDescuento;

  const porcentajeRecargo = tipoEnvio === "EXPRESS" ? 0.25 : 0;
  const recargo = (subtotal - descuento) * porcentajeRecargo;

  const total = subtotal - descuento + recargo;

  return { base, costoPeso, descuento, recargo, total };
}

const URL_API = "http://localhost:8000/api/cotizar"; 

   async function cotizarEnvio(datos) {
     return cotizarReal(datos);
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

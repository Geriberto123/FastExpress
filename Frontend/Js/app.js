const form = document.getElementById("form-cotizacion");
const btnCotizar = document.getElementById("btn-cotizar");
const mensajeError = document.getElementById("mensaje-error");
const cargando = document.getElementById("cargando");
const resultado = document.getElementById("resultado");

const campos = [
  { id: "peso", validar: validarPeso },
  { id: "tipoCliente", validar: validarTipoCliente },
  { id: "tipoEnvio", validar: validarTipoEnvio },
];

function formatearDinero(valor) {
  return "$" + Number(valor).toFixed(2);
}

function mostrarErrorCampo(id, mensaje) {
  document.getElementById("error-" + id).textContent = mensaje;
}

function limpiarMensajes() {
  campos.forEach((campo) => mostrarErrorCampo(campo.id, ""));
  mensajeError.hidden = true;
  mensajeError.textContent = "";
  resultado.hidden = true;
}

function mostrarErrorGeneral(mensaje) {
  mensajeError.textContent = mensaje;
  mensajeError.hidden = false;
}

function mostrarResultado(datos) {
  document.getElementById("res-base").textContent = formatearDinero(datos.base);
  document.getElementById("res-peso").textContent = formatearDinero(datos.costoPeso);
  document.getElementById("res-descuento").textContent = "-" + formatearDinero(datos.descuento);
  document.getElementById("res-recargo").textContent = "+" + formatearDinero(datos.recargo);
  document.getElementById("res-total").textContent = formatearDinero(datos.total);
  resultado.hidden = false;
}

function ponerEnCarga(activo) {
  cargando.hidden = !activo;
  btnCotizar.disabled = activo;
}

function validarFormulario() {
  let todoValido = true;
  let primerInvalido = null;
  let peso = null;

  campos.forEach((campo) => {
    const elemento = document.getElementById(campo.id);
    const res = campo.validar(elemento.value);

    mostrarErrorCampo(campo.id, res.mensaje);

    if (!res.valido) {
      todoValido = false;
      if (!primerInvalido) primerInvalido = elemento;
    } else if (campo.id === "peso") {
      peso = res.valor;
    }
  });

  if (primerInvalido) primerInvalido.focus();
  return todoValido ? peso : null;
}

form.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  limpiarMensajes();

  const peso = validarFormulario();
  if (peso === null) return; // hay errores de validación: no se llama a la API

  const datos = {
    peso: peso,
    tipoCliente: document.getElementById("tipoCliente").value,
    tipoEnvio: document.getElementById("tipoEnvio").value,
  };

  ponerEnCarga(true);

  try {
    const respuesta = await cotizarEnvio(datos);
    mostrarResultado(respuesta);
  } catch (error) {
    mostrarErrorGeneral(error.message);
  } finally {
    ponerEnCarga(false);
  }
});
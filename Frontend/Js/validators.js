const PESO_MIN = 0.01;
const PESO_MAX = 20;
const TIPOS_CLIENTE = ["NUEVO", "FRECUENTE", "VIP"];
const TIPOS_ENVIO = ["ESTANDAR", "EXPRESS"];

function validarPeso(texto) {
    const limpio = String(texto ?? "").trim();
    if (limpio === "") {
        return { valido: false, mensaje: "El peso es obligatorio.", valor: null };
    }
     if (!/^\d+([.,]\d{1,2})?$/.test(limpio)) {
        return { valido: false, mensaje: "Ingrese un número válido, positivo y con máximo 2 decimales.", valor: null };
     }
     const valor = parseFloat(limpio.replace(",", "."));
     if (valor < PESO_MIN) {
        return { valido: false, mensaje: "El peso mínimo es 0.01 kg.", valor: null };
     }
     if (valor > PESO_MAX) {
        return { valido: false, mensaje: "El peso máximo es 20 kg.", valor: null };
     }
     return { valido: true, mensaje: "Peso válido.", valor };
}
function validarTipoCliente(valor) {
  if (!valor) {
    return { valido: false, mensaje: "Seleccione un tipo de cliente." };
  }
  if (!TIPOS_CLIENTE.includes(valor)) {
    return { valido: false, mensaje: "Tipo de cliente no válido." };
  }
  return { valido: true, mensaje: "" };
}

function validarTipoEnvio(valor) {
  if (!valor) {
    return { valido: false, mensaje: "Seleccione un tipo de envío." };
  }
  if (!TIPOS_ENVIO.includes(valor)) {
    return { valido: false, mensaje: "Tipo de envío no válido." };
  }
  return { valido: true, mensaje: "" };
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { validarPeso, validarTipoCliente, validarTipoEnvio };
}
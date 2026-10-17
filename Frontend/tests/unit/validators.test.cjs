const test = require('node:test');
const assert = require('node:assert/strict');
const { validarPeso } = require('../../Js/validators.js');

test('CP-001 acepta punto, coma y espacios como el mismo peso', () => {
  for (const entrada of ['7.5', '7,5', ' 7,5 ']) {
    assert.deepEqual(validarPeso(entrada), { valido: true, mensaje: '', valor: 7.5 });
  }
});

test('CP-002 rechaza los formatos no admitidos', () => {
  for (const entrada of ['1,000.5', '1.000,5', '5,', ',', '--5', '.5', '5.', '5kg', '1e3', '0.001', '5.005']) {
    assert.equal(validarPeso(entrada).mensaje, 'Ingrese un número válido, positivo y con máximo 2 decimales.');
  }
});

test('CP-003 da prioridad al formato para 20.001', () => {
  assert.equal(validarPeso('20.001').mensaje, 'Ingrese un número válido, positivo y con máximo 2 decimales.');
});

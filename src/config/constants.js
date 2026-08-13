// Informacoes fixas da seletiva EAFI 2026/2027.

const LOCAL_PROVA = 'SEDES - EMIEF Prof.ª Anna dos Reis Signorini, Av. Amador Bueno da Veiga, 220 - Jardim Jaraguá';
const HORARIO_PROVA_FEMININO = '8h às 8:30h';
const HORARIO_PROVA_MASCULINO = '13h às 13:30h';
const DATA_PROVA_FEMININO = '19/09/2026';
const DATA_PROVA_MASCULINO = '20/09/2026';
const DATA_DIVULGACAO = '15/10/2026';

/**
 * Retorna a data da prova (string dd/mm/aaaa) de acordo com o sexo do candidato.
 * @param {string} sexo "F" ou "M"
 */
function dataProvaPorSexo(sexo) {
  return sexo === 'F' ? DATA_PROVA_FEMININO : DATA_PROVA_MASCULINO;
}

/**
 * Retorna o horario da prova de acordo com o sexo do candidato.
 * @param {string} sexo "F" ou "M"
 */
function horarioProvaPorSexo(sexo) {
  return sexo === 'F' ? HORARIO_PROVA_FEMININO : HORARIO_PROVA_MASCULINO;
}

module.exports = {
  LOCAL_PROVA,
  HORARIO_PROVA_FEMININO,
  HORARIO_PROVA_MASCULINO,
  DATA_PROVA_FEMININO,
  DATA_PROVA_MASCULINO,
  DATA_DIVULGACAO,
  dataProvaPorSexo,
  horarioProvaPorSexo
};
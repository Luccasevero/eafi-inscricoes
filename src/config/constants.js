// Informacoes fixas da seletiva EAFI 2026/2027.
module.exports = {
  LOCAL_PROVA: 'SEDES - EMIEF Prof.ª Anna dos Reis Signorini, Av. Amador Bueno da Veiga, 220 - Jardim Jaraguá',
  HORARIO_PROVA: '8h às 14h',
  DATA_PROVA_FEMININO: '19/09/2026',
  DATA_PROVA_MASCULINO: '20/09/2026',
  DATA_DIVULGACAO: '15/10/2026',

  /**
   * Retorna a data da prova (string dd/mm/aaaa) de acordo com o sexo do candidato.
   * @param {string} sexo "F" ou "M"
   */
  dataProvaPorSexo(sexo) {
    return sexo === 'F' ? this.DATA_PROVA_FEMININO : this.DATA_PROVA_MASCULINO;
  }
};

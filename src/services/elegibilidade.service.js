/**
 * Regras de elegibilidade de modalidade.
 *
 * Uma modalidade e elegivel para um candidato quando:
 *  - modalidade.sexo === "AMBOS" OU modalidade.sexo === sexoDoCandidato
 *  - o ano de nascimento do candidato esta em modalidade.anosPermitidos
 */

function anoNascimento(dataNascimento) {
  const d = new Date(dataNascimento);
  return d.getUTCFullYear();
}

function isElegivel(modalidade, { sexo, dataNascimento }) {
  const ano = anoNascimento(dataNascimento);
  const sexoOk = modalidade.sexo === 'AMBOS' || modalidade.sexo === sexo;
  const anoOk = modalidade.anosPermitidos.includes(ano);
  return sexoOk && anoOk;
}

/**
 * Recebe a lista completa de modalidades e os dados do candidato,
 * e devolve a lista com uma flag `elegivel` em cada item, ordenada
 * com as elegiveis primeiro (mantendo a ordem original dentro de cada grupo).
 */
function listarComElegibilidade(modalidades, candidato) {
  const comFlag = modalidades.map((m) => ({
    ...m,
    elegivel: isElegivel(m, candidato)
  }));

  const elegiveis = comFlag.filter((m) => m.elegivel);
  const naoElegiveis = comFlag.filter((m) => !m.elegivel);

  return [...elegiveis, ...naoElegiveis];
}

module.exports = { isElegivel, listarComElegibilidade, anoNascimento };

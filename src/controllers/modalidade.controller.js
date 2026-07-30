const prisma = require('../config/prisma');
const { listarComElegibilidade } = require('../services/elegibilidade.service');

/**
 * GET /api/modalidades
 * Lista todas as modalidades. Se `sexo` e `dataNascimento` forem informados
 * via query string, devolve tambem a flag `elegivel` e ja ordena elegiveis primeiro.
 */
async function listar(req, res) {
  const modalidades = await prisma.modalidade.findMany({ orderBy: { id: 'asc' } });

  const { sexo, dataNascimento } = req.query;
  if (sexo && dataNascimento) {
    const ordenadas = listarComElegibilidade(modalidades, { sexo, dataNascimento });
    return res.json(ordenadas);
  }

  return res.json(modalidades);
}

module.exports = { listar };

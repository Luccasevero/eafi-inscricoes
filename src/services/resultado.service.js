const prisma = require('../config/prisma');

const STATUS_VALIDOS = ['pendente', 'aprovado', 'reprovado'];

/** Garante que existe a linha singleton de configuracao (id=1) e a retorna. */
async function obterConfig() {
  let config = await prisma.resultadoConfig.findUnique({ where: { id: 1 } });
  if (!config) {
    config = await prisma.resultadoConfig.create({ data: { id: 1, publicado: false } });
  }
  return config;
}

async function estaPublicado() {
  const config = await obterConfig();
  return config.publicado;
}

async function publicarResultado() {
  await obterConfig();
  return prisma.resultadoConfig.update({
    where: { id: 1 },
    data: { publicado: true, publicadoEm: new Date() }
  });
}

async function despublicarResultado() {
  await obterConfig();
  return prisma.resultadoConfig.update({
    where: { id: 1 },
    data: { publicado: false, publicadoEm: null }
  });
}

async function definirStatus(inscricaoId, status) {
  if (!STATUS_VALIDOS.includes(status)) {
    throw new Error(`Status invalido: ${status}`);
  }
  return prisma.inscricao.update({
    where: { id: Number(inscricaoId) },
    data: { status }
  });
}

module.exports = {
  STATUS_VALIDOS,
  obterConfig,
  estaPublicado,
  publicarResultado,
  despublicarResultado,
  definirStatus
};

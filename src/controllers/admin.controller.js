const prisma = require('../config/prisma');
const { dataProvaPorSexo } = require('../config/constants');
const resultadoService = require('../services/resultado.service');

function linhaResumida(inscricao) {
  return {
    id: inscricao.id,
    codigoConfirmacao: inscricao.codigoConfirmacao,
    nomeCompleto: inscricao.nomeCompleto,
    dataNascimento: inscricao.dataNascimento,
    sexo: inscricao.sexo,
    modalidadeId: inscricao.modalidadeId,
    modalidade: `${inscricao.modalidade.nome} (${inscricao.modalidade.sexo})`,
    responsavelProva: inscricao.responsavelProva
      ? `${inscricao.responsavelProva.nome} (${inscricao.responsavelProva.tipo})`
      : '-',
    telefones: inscricao.telefones.join(', '),
    email: inscricao.email,
    escola: inscricao.escola,
    deficiencia: inscricao.deficiencia ? 'Sim' : 'Não',
    medicamento: inscricao.medicamento ? 'Sim' : 'Não',
    convenio: inscricao.convenio ? 'Sim' : 'Não',
    dataProva: dataProvaPorSexo(inscricao.sexo),
    status: inscricao.status
  };
}

/**
 * GET /api/admin/inscricoes?modalidadeId=
 * Lista inscricoes (opcionalmente filtradas por modalidade) e a contagem
 * de inscritos por modalidade.
 */
async function listar(req, res) {
  const { modalidadeId } = req.query;

  const where = modalidadeId ? { modalidadeId: Number(modalidadeId) } : {};

  const [inscricoes, contagemPorModalidade, modalidades] = await Promise.all([
    prisma.inscricao.findMany({
      where,
      include: { modalidade: true, responsavelProva: true },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.inscricao.groupBy({ by: ['modalidadeId'], _count: { _all: true } }),
    prisma.modalidade.findMany({ orderBy: { id: 'asc' } })
  ]);

  const contagemMap = Object.fromEntries(contagemPorModalidade.map((c) => [c.modalidadeId, c._count._all]));

  const modalidadesComContagem = modalidades.map((m) => ({
    id: m.id,
    nome: m.nome,
    sexo: m.sexo,
    total: contagemMap[m.id] || 0
  }));

  const resultadoConfig = await resultadoService.obterConfig();

  res.json({
    total: inscricoes.length,
    inscricoes: inscricoes.map(linhaResumida),
    modalidades: modalidadesComContagem,
    resultado: { publicado: resultadoConfig.publicado, publicadoEm: resultadoConfig.publicadoEm }
  });
}

/** GET /api/admin/inscricoes/export - exporta CSV de todas as inscricoes. */
async function exportarCsv(req, res) {
  const inscricoes = await prisma.inscricao.findMany({
    include: { modalidade: true, responsavelProva: true },
    orderBy: { createdAt: 'desc' }
  });

  const cabecalho = [
    'Codigo', 'Nome completo', 'Data nascimento', 'Sexo', 'Modalidade',
    'Responsavel na prova', 'Telefones', 'Email', 'Escola', 'Ano escolar',
    'Deficiencia', 'Medicamento', 'Convenio', 'Data da prova'
  ];

  const escaparCsv = (valor) => `"${String(valor).replace(/"/g, '""')}"`;

  const linhas = inscricoes.map((i) => {
    const r = linhaResumida(i);
    return [
      r.codigoConfirmacao,
      r.nomeCompleto,
      new Date(r.dataNascimento).toLocaleDateString('pt-BR'),
      r.sexo,
      r.modalidade,
      r.responsavelProva,
      r.telefones,
      r.email,
      r.escola,
      i.anoEscolar,
      r.deficiencia,
      r.medicamento,
      r.convenio,
      r.dataProva
    ].map(escaparCsv).join(',');
  });

  const csv = [cabecalho.map(escaparCsv).join(','), ...linhas].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inscricoes-eafi.csv"');
  res.send('\uFEFF' + csv); // BOM para acentuacao correta no Excel
}

/** PATCH /api/admin/inscricoes/:id/status - marca uma inscricao como aprovada/reprovada/pendente */
async function atualizarStatus(req, res) {
  const { id } = req.params;
  const { status } = req.body;

  if (!resultadoService.STATUS_VALIDOS.includes(status)) {
    return res.status(400).json({ erro: 'Status invalido. Use "pendente", "aprovado" ou "reprovado".' });
  }

  try {
    const atualizada = await resultadoService.definirStatus(id, status);
    return res.json({ id: atualizada.id, status: atualizada.status });
  } catch (err) {
    console.error(err);
    return res.status(404).json({ erro: 'Inscricao nao encontrada.' });
  }
}

/** POST /api/admin/resultado/publicar - torna os status visiveis na consulta publica */
async function publicarResultado(req, res) {
  const config = await resultadoService.publicarResultado();
  return res.json({ publicado: config.publicado, publicadoEm: config.publicadoEm });
}

/** POST /api/admin/resultado/despublicar - esconde novamente os status da consulta publica */
async function despublicarResultado(req, res) {
  const config = await resultadoService.despublicarResultado();
  return res.json({ publicado: config.publicado, publicadoEm: config.publicadoEm });
}

module.exports = { listar, exportarCsv, atualizarStatus, publicarResultado, despublicarResultado };

const crypto = require('crypto');
const prisma = require('../config/prisma');
const { isElegivel } = require('./elegibilidade.service');
const resultadoService = require('./resultado.service');
const { dataProvaPorSexo, horarioProvaPorSexo, LOCAL_PROVA, DATA_DIVULGACAO, INSCRICOES_ABERTAS } = require('../config/constants');

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/** Gera um codigo curto do tipo "EAFI-A1B2C3". */
function gerarCodigoConfirmacao() {
  const sufixo = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `EAFI-${sufixo}`;
}

function required(value, field) {
  if (value === undefined || value === null || String(value).trim() === '') {
    throw new ValidationError(`Campo obrigatorio: ${field}`, field);
  }
}

async function checarDuplicidade({ email, nomeCompleto, dataNascimento }) {
  const existente = await prisma.inscricao.findFirst({
    where: {
      OR: [
        { email: email.trim().toLowerCase() },
        {
          nomeCompleto: { equals: nomeCompleto.trim(), mode: 'insensitive' },
          dataNascimento: new Date(dataNascimento)
        }
      ]
    }
  });
  return existente;
}

async function criarInscricao(payload) {
  if (!INSCRICOES_ABERTAS) {
    throw new ValidationError(
      'As inscrições para a seletiva EAFI 2026/2027 estão encerradas.',
      'inscricoesFechadas'
    );
  }

  const {
    nomeCompleto, dataNascimento, sexo, email, escola, anoEscolar,
    rua, numero, bairro, cidade, complemento,
    telefones,
    praticaEsportes, praticaEsportesDetalhe,
    deficiencia, deficienciaDetalhe,
    medicamento, medicamentoDetalhe,
    convenio, convenioNome,
    autorizado,
    responsaveis, // [{ nome, telefone, tipo }]
    modalidadeId,
    responsavelProvaIndex // indice dentro do array `responsaveis`
  } = payload;

  // Validacao basica dos campos obrigatorios da Etapa 1
  required(nomeCompleto, 'nomeCompleto');
  required(dataNascimento, 'dataNascimento');
  required(sexo, 'sexo');
  required(email, 'email');
  required(escola, 'escola');
  required(anoEscolar, 'anoEscolar');
  required(rua, 'rua');
  required(numero, 'numero');
  required(bairro, 'bairro');
  required(cidade, 'cidade');

  if (!['F', 'M'].includes(sexo)) {
    throw new ValidationError('Sexo deve ser "F" ou "M"', 'sexo');
  }
  if (!Array.isArray(telefones) || telefones.length === 0) {
    throw new ValidationError('Informe ao menos um telefone de contato', 'telefones');
  }
  if (!Array.isArray(responsaveis) || responsaveis.length === 0) {
    throw new ValidationError('Informe ao menos um responsavel', 'responsaveis');
  }
  responsaveis.forEach((r, i) => {
    required(r.nome, `responsaveis[${i}].nome`);
    required(r.tipo, `responsaveis[${i}].tipo`);
  });
  if (!modalidadeId) {
    throw new ValidationError('Modalidade nao selecionada', 'modalidadeId');
  }
  if (
    responsavelProvaIndex === undefined ||
    responsavelProvaIndex === null ||
    !responsaveis[responsavelProvaIndex]
  ) {
    throw new ValidationError('Selecione o responsavel no dia da prova', 'responsavelProvaIndex');
  }
  if (typeof autorizado !== 'boolean') {
    throw new ValidationError('Informe se o candidato esta autorizado a praticar esportes', 'autorizado');
  }

  // Checa duplicidade (e-mail OU nome+data de nascimento)
  const duplicado = await checarDuplicidade({ email, nomeCompleto, dataNascimento });
  if (duplicado) {
    throw new ValidationError(
      'Ja existe uma inscricao ativa com este e-mail ou com este nome e data de nascimento.',
      'duplicado'
    );
  }

  // Confere a modalidade e recalcula elegibilidade no servidor (nunca confiar so no client)
  const modalidade = await prisma.modalidade.findUnique({ where: { id: Number(modalidadeId) } });
  if (!modalidade) {
    throw new ValidationError('Modalidade nao encontrada', 'modalidadeId');
  }
  if (!isElegivel(modalidade, { sexo, dataNascimento })) {
    throw new ValidationError(
      'Idade ou sexo nao elegivel para esta modalidade.',
      'modalidadeId'
    );
  }

  const codigoConfirmacao = gerarCodigoConfirmacao();

  const inscricao = await prisma.inscricao.create({
    data: {
      codigoConfirmacao,
      nomeCompleto: nomeCompleto.trim(),
      dataNascimento: new Date(dataNascimento),
      sexo,
      email: email.trim().toLowerCase(),
      escola: escola.trim(),
      anoEscolar,
      rua,
      numero,
      bairro,
      cidade,
      complemento: complemento || null,
      telefones,
      praticaEsportes: !!praticaEsportes,
      praticaEsportesDetalhe: praticaEsportes ? (praticaEsportesDetalhe || null) : null,
      deficiencia: !!deficiencia,
      deficienciaDetalhe: deficiencia ? (deficienciaDetalhe || null) : null,
      medicamento: !!medicamento,
      medicamentoDetalhe: medicamento ? (medicamentoDetalhe || null) : null,
      convenio: !!convenio,
      convenioNome: convenio ? (convenioNome || null) : null,
      autorizado,
      modalidadeId: modalidade.id,
      responsaveis: {
        create: responsaveis.map((r) => ({
          nome: r.nome.trim(),
          telefone: r.telefone || null,
          tipo: r.tipo
        }))
      }
    },
    include: { responsaveis: true, modalidade: true }
  });

  // Agora que os responsaveis foram criados, vincula o "responsavel no dia da prova"
  const responsavelEscolhido = inscricao.responsaveis[responsavelProvaIndex];
  const inscricaoFinal = await prisma.inscricao.update({
    where: { id: inscricao.id },
    data: { responsavelProvaId: responsavelEscolhido.id },
    include: { responsaveis: true, modalidade: true, responsavelProva: true }
  });

  const publicado = await resultadoService.estaPublicado();
  return montarResumo(inscricaoFinal, publicado);
}

/** Formata a inscricao para o formato de resumo/comprovante usado no front-end. */
function montarResumo(inscricao, resultadoPublicado) {
  return {
    codigoConfirmacao: inscricao.codigoConfirmacao,
    nomeCompleto: inscricao.nomeCompleto,
    dataNascimento: inscricao.dataNascimento,
    sexo: inscricao.sexo,
    email: inscricao.email,
    escola: inscricao.escola,
    anoEscolar: inscricao.anoEscolar,
    endereco: {
      rua: inscricao.rua,
      numero: inscricao.numero,
      bairro: inscricao.bairro,
      cidade: inscricao.cidade,
      complemento: inscricao.complemento
    },
    telefones: inscricao.telefones,
    praticaEsportes: inscricao.praticaEsportes,
    praticaEsportesDetalhe: inscricao.praticaEsportesDetalhe,
    deficiencia: inscricao.deficiencia,
    deficienciaDetalhe: inscricao.deficienciaDetalhe,
    medicamento: inscricao.medicamento,
    medicamentoDetalhe: inscricao.medicamentoDetalhe,
    convenio: inscricao.convenio,
    convenioNome: inscricao.convenioNome,
    modalidade: {
      nome: inscricao.modalidade.nome,
      sexo: inscricao.modalidade.sexo
    },
    responsaveis: inscricao.responsaveis.map((r) => ({ nome: r.nome, tipo: r.tipo, telefone: r.telefone })),
    responsavelProva: inscricao.responsavelProva
      ? { nome: inscricao.responsavelProva.nome, tipo: inscricao.responsavelProva.tipo }
      : null,
    prova: {
      data: dataProvaPorSexo(inscricao.sexo),
      horario: horarioProvaPorSexo(inscricao.sexo),
      local: LOCAL_PROVA,
      dataDivulgacao: DATA_DIVULGACAO
    },
    resultado: {
      publicado: !!resultadoPublicado,
      // So revela o status real (aprovado/reprovado) depois que o resultado for publicado.
      status: resultadoPublicado ? inscricao.status : 'pendente'
    },
    createdAt: inscricao.createdAt
  };
}

async function buscarPorCodigo(codigo) {
  const [inscricao, publicado] = await Promise.all([
    prisma.inscricao.findUnique({
      where: { codigoConfirmacao: codigo.trim().toUpperCase() },
      include: { responsaveis: true, modalidade: true, responsavelProva: true }
    }),
    resultadoService.estaPublicado()
  ]);
  return inscricao ? montarResumo(inscricao, publicado) : null;
}

async function buscarPorEmailEDataNascimento(email, dataNascimento) {
  const [inscricao, publicado] = await Promise.all([
    prisma.inscricao.findFirst({
      where: {
        email: email.trim().toLowerCase(),
        dataNascimento: new Date(dataNascimento)
      },
      include: { responsaveis: true, modalidade: true, responsavelProva: true }
    }),
    resultadoService.estaPublicado()
  ]);
  return inscricao ? montarResumo(inscricao, publicado) : null;
}

module.exports = {
  ValidationError,
  criarInscricao,
  buscarPorCodigo,
  buscarPorEmailEDataNascimento,
  montarResumo
};
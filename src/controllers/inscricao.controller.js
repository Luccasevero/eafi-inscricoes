const inscricaoService = require('../services/inscricao.service');

async function criar(req, res) {
  try {
    const resumo = await inscricaoService.criarInscricao(req.body);
    return res.status(201).json(resumo);
  } catch (err) {
    if (err instanceof inscricaoService.ValidationError) {
      return res.status(400).json({ erro: err.message, campo: err.field });
    }
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao criar inscricao.' });
  }
}

async function consultar(req, res) {
  try {
    const { codigo, email, dataNascimento } = req.query;

    let resultado = null;
    if (codigo) {
      resultado = await inscricaoService.buscarPorCodigo(codigo);
    } else if (email && dataNascimento) {
      resultado = await inscricaoService.buscarPorEmailEDataNascimento(email, dataNascimento);
    } else {
      return res.status(400).json({ erro: 'Informe o codigo de confirmacao, ou e-mail + data de nascimento.' });
    }

    if (!resultado) {
      return res.status(404).json({ erro: 'Nenhuma inscricao encontrada com esses dados.' });
    }
    return res.json(resultado);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno ao consultar inscricao.' });
  }
}

module.exports = { criar, consultar };

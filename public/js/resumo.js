/**
 * Renderiza o resumo/comprovante de uma inscrição (objeto retornado pela API)
 * dentro do elemento `container`.
 */
function renderResumo(dados, container) {
  const fmtData = (iso) => new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  const simNao = (b) => (b ? 'Sim' : 'Não');

  const linhasSaude = [];
  linhasSaude.push(['Pratica esportes?', simNao(dados.praticaEsportes) + (dados.praticaEsportesDetalhe ? ` — ${dados.praticaEsportesDetalhe}` : '')]);
  linhasSaude.push(['Possui deficiência?', simNao(dados.deficiencia) + (dados.deficienciaDetalhe ? ` — ${dados.deficienciaDetalhe}` : '')]);
  linhasSaude.push(['Toma medicamento?', simNao(dados.medicamento) + (dados.medicamentoDetalhe ? ` — ${dados.medicamentoDetalhe}` : '')]);
  linhasSaude.push(['Possui convênio médico?', simNao(dados.convenio) + (dados.convenioNome ? ` — ${dados.convenioNome}` : '')]);

  function blocoResultado() {
    if (!dados.resultado || !dados.resultado.publicado) {
      return `
        <div class="secao-titulo">Resultado da seletiva</div>
        <p class="dica" style="margin-bottom: 20px;">O resultado ainda não foi divulgado. Fique de olho — a previsão é <b>${dados.prova.dataDivulgacao}</b>. Volte a esta página para consultar.</p>
      `;
    }
    const status = dados.resultado.status;
    const textos = {
      aprovado: 'Aprovado(a) 🎉',
      reprovado: 'Não aprovado(a) nesta seletiva',
      pendente: 'Resultado ainda não definido para esta modalidade'
    };
    return `
      <div class="secao-titulo">Resultado da seletiva</div>
      <p style="margin-bottom: 20px;"><span class="resultado-selo status-${status}">${textos[status]}</span></p>
    `;
  }

  container.innerHTML = `
    <div class="card">
      <div class="comprovante-cabecalho">
        <div class="check-circulo">✓</div>
        <h2>Inscrição confirmada!</h2>
        <p>Guarde o código abaixo — ele será necessário para consultar sua inscrição.</p>
        <div class="comprovante-codigo">${dados.codigoConfirmacao}</div>
      </div>

      <div class="secao-titulo">Dados do candidato</div>
      <table class="tabela-resumo">
        <tr><td class="rotulo">Nome completo</td><td class="valor">${dados.nomeCompleto}</td></tr>
        <tr><td class="rotulo">Data de nascimento</td><td class="valor">${fmtData(dados.dataNascimento)}</td></tr>
        <tr><td class="rotulo">Sexo</td><td class="valor">${dados.sexo === 'F' ? 'Feminino' : 'Masculino'}</td></tr>
        <tr><td class="rotulo">E-mail</td><td class="valor">${dados.email}</td></tr>
        <tr><td class="rotulo">Escola</td><td class="valor">${dados.escola} — ${dados.anoEscolar}</td></tr>
        <tr><td class="rotulo">Endereço</td><td class="valor">${dados.endereco.rua}, ${dados.endereco.numero} — ${dados.endereco.bairro}, ${dados.endereco.cidade}${dados.endereco.complemento ? ' — ' + dados.endereco.complemento : ''}</td></tr>
        <tr><td class="rotulo">Telefone(s)</td><td class="valor">${dados.telefones.join(', ')}</td></tr>
      </table>

      <div class="secao-titulo">Saúde</div>
      <table class="tabela-resumo">
        ${linhasSaude.map(([r, v]) => `<tr><td class="rotulo">${r}</td><td class="valor">${v}</td></tr>`).join('')}
      </table>

      <div class="secao-titulo">Modalidade e prova</div>
      <table class="tabela-resumo">
        <tr><td class="rotulo">Modalidade escolhida</td><td class="valor">${dados.modalidade.nome}</td></tr>
        <tr><td class="rotulo">Responsável no dia da prova</td><td class="valor">${dados.responsavelProva ? `${dados.responsavelProva.nome} (${dados.responsavelProva.tipo})` : '-'}</td></tr>
        <tr><td class="rotulo">Data da prova</td><td class="valor">${dados.prova.data}</td></tr>
        <tr><td class="rotulo">Horário</td><td class="valor">${dados.prova.horario}</td></tr>
        <tr><td class="rotulo">Local</td><td class="valor">${dados.prova.local}</td></tr>
        <tr><td class="rotulo">Divulgação dos aprovados</td><td class="valor">${dados.prova.dataDivulgacao}</td></tr>
      </table>

      ${blocoResultado()}

      <div class="secao-titulo">Responsáveis cadastrados</div>
      <table class="tabela-resumo">
        ${dados.responsaveis.map((r) => `<tr><td class="rotulo">${r.tipo}</td><td class="valor">${r.nome}${r.telefone ? ' — ' + r.telefone : ''}</td></tr>`).join('')}
      </table>

      <div class="form-acoes">
        <a href="/" class="btn btn-secondary">Voltar ao início</a>
        <button type="button" class="btn btn-primary" onclick="window.print()">Imprimir comprovante</button>
      </div>
    </div>
  `;
}

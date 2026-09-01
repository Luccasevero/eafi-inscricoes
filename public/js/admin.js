(function () {
  'use strict';

  const telaLogin = document.getElementById('tela-login');
  const painel = document.getElementById('painel');
  const erroLogin = document.getElementById('erro-login');
  const corpoTabela = document.getElementById('corpo-tabela');
  const tabelaVazia = document.getElementById('tabela-vazia');
  const contagensEl = document.getElementById('contagens');
  const totalEl = document.getElementById('total-inscritos');

  let credenciais = sessionStorage.getItem('eafi_admin_auth'); // "Basic base64(user:pass)"
  let modalidadeFiltro = '';
  let resultadoPublicado = false;
  let inscricoesAtuais = [];
  let modalidadesAtuais = [];

  const cardResultado = document.getElementById('card-resultado');
  const statusPublicacaoEl = document.getElementById('status-publicacao');
  const btnPublicar = document.getElementById('btn-publicar');

  function renderStatusPublicacao(resultado) {
    resultadoPublicado = resultado.publicado;
    cardResultado.classList.toggle('publicado', resultadoPublicado);
    cardResultado.classList.toggle('nao-publicado', !resultadoPublicado);
    btnPublicar.classList.toggle('ja-publicado', resultadoPublicado);

    if (resultadoPublicado) {
      const dataFmt = resultado.publicadoEm ? new Date(resultado.publicadoEm).toLocaleString('pt-BR') : '';
      statusPublicacaoEl.innerHTML = `<span class="resultado-selo status-aprovado">Publicado</span> ${dataFmt ? 'em ' + dataFmt : ''} — os candidatos já podem ver o resultado na consulta.`;
      btnPublicar.textContent = 'Despublicar resultado';
    } else {
      statusPublicacaoEl.innerHTML = `<span class="resultado-selo status-pendente">Não publicado</span> — os candidatos ainda não veem o resultado marcado abaixo.`;
      btnPublicar.textContent = 'Publicar resultado da seletiva';
    }
  }

  btnPublicar.addEventListener('click', async () => {
    const acao = resultadoPublicado ? 'despublicar' : 'publicar';
    const mensagem = resultadoPublicado
      ? 'Isso vai ESCONDER o resultado da consulta pública novamente. Continuar?'
      : 'Isso vai TORNAR PÚBLICO o resultado marcado para cada inscrito, visível na consulta. Continuar?';
    if (!confirm(mensagem)) return;

    const resp = await fetch(`/api/admin/resultado/${acao}`, { method: 'POST', headers: authHeader() });
    if (!resp.ok) return;
    const dados = await resp.json();
    renderStatusPublicacao(dados);
  });

  function authHeader() {
    return { Authorization: credenciais };
  }

  async function tentarLogin() {
    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;
    credenciais = 'Basic ' + btoa(`${usuario}:${senha}`);

    const ok = await carregarDados();
    if (ok) {
      sessionStorage.setItem('eafi_admin_auth', credenciais);
      telaLogin.style.display = 'none';
      painel.style.display = '';
    } else {
      erroLogin.textContent = 'Usuário ou senha inválidos.';
      erroLogin.classList.add('visivel');
      credenciais = null;
    }
  }

  document.getElementById('btn-entrar').addEventListener('click', tentarLogin);
  document.getElementById('senha').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') tentarLogin();
  });

  document.getElementById('btn-sair').addEventListener('click', () => {
    sessionStorage.removeItem('eafi_admin_auth');
    credenciais = null;
    painel.style.display = 'none';
    telaLogin.style.display = '';
  });

  async function carregarDados() {
    const url = modalidadeFiltro
      ? `/api/admin/inscricoes?modalidadeId=${encodeURIComponent(modalidadeFiltro)}`
      : '/api/admin/inscricoes';
    const resp = await fetch(url, { headers: authHeader() });
    if (!resp.ok) return false;

    const dados = await resp.json();
    inscricoesAtuais = dados.inscricoes;
    modalidadesAtuais = dados.modalidades;
    renderTabela(dados.inscricoes);
    renderContagens(dados.modalidades);
    renderStatusPublicacao(dados.resultado);
    totalEl.textContent = dados.total;
    return true;
  }

  function renderContagens(modalidades) {
    contagensEl.innerHTML = '';

    const chipTodas = document.createElement('button');
    chipTodas.type = 'button';
    chipTodas.className = 'contagem-chip' + (modalidadeFiltro === '' ? ' ativa' : '');
    chipTodas.innerHTML = `Todas <b>(${modalidades.reduce((s, m) => s + m.total, 0)})</b>`;
    chipTodas.addEventListener('click', () => { modalidadeFiltro = ''; carregarDados(); });
    contagensEl.appendChild(chipTodas);

    modalidades.forEach((m) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'contagem-chip' + (String(modalidadeFiltro) === String(m.id) ? ' ativa' : '');
      chip.innerHTML = `${m.nome} (${m.sexo}) <b>${m.total}</b>`;
      chip.addEventListener('click', () => { modalidadeFiltro = m.id; carregarDados(); });
      contagensEl.appendChild(chip);
    });
  }

  function renderTabela(inscricoes) {
    corpoTabela.innerHTML = '';
    tabelaVazia.style.display = inscricoes.length ? 'none' : '';

    inscricoes.forEach((i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i.codigoConfirmacao}</td>
        <td>${i.nomeCompleto}</td>
        <td>${new Date(i.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
        <td>${i.sexo}</td>
        <td>${i.modalidade}</td>
        <td>${i.responsavelProva}</td>
        <td>${i.telefones}</td>
        <td>${i.email}</td>
        <td>${i.escola}</td>
        <td>${i.deficiencia}</td>
        <td>${i.medicamento}</td>
        <td>${i.convenio}</td>
        <td>${i.dataProva}</td>
        <td></td>
      `;
      const tdStatus = tr.querySelector('td:last-child');
      const select = document.createElement('select');
      select.className = `select-status status-${i.status}`;
      select.innerHTML = `
        <option value="pendente" ${i.status === 'pendente' ? 'selected' : ''}>Pendente</option>
        <option value="aprovado" ${i.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
        <option value="reprovado" ${i.status === 'reprovado' ? 'selected' : ''}>Reprovado</option>
      `;
      select.addEventListener('change', async () => {
        const novoStatus = select.value;
        select.disabled = true;
        const resp = await fetch(`/api/admin/inscricoes/${i.id}/status`, {
          method: 'PATCH',
          headers: { ...authHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: novoStatus })
        });
        select.disabled = false;
        if (resp.ok) {
          select.className = `select-status status-${novoStatus}`;
        } else {
          select.value = i.status; // reverte em caso de erro
        }
      });
      tdStatus.appendChild(select);
      corpoTabela.appendChild(tr);
    });
  }

  document.getElementById('btn-exportar').addEventListener('click', async () => {
    const resp = await fetch('/api/admin/inscricoes/export', { headers: authHeader() });
    if (!resp.ok) return;
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inscricoes-eafi.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  /** Monta a tabela simples (nome, data de nascimento, escola, responsável, assinatura) para impressão. */
  function popularImpressao() {
    const modalidadeSelecionada = modalidadesAtuais.find((m) => String(m.id) === String(modalidadeFiltro));
    const tituloModalidade = modalidadeSelecionada
      ? `${modalidadeSelecionada.nome} (${modalidadeSelecionada.sexo})`
      : 'Todas as modalidades';

    document.getElementById('impressao-titulo').textContent = `Lista de inscritos — ${tituloModalidade}`;
    document.getElementById('impressao-meta').textContent =
      `${inscricoesAtuais.length} inscrito(s) — impresso em ${new Date().toLocaleString('pt-BR')}`;

    const corpo = document.getElementById('corpo-impressao');
    const inscricoesOrdenadas = [...inscricoesAtuais].sort((a, b) =>
      a.nomeCompleto.localeCompare(b.nomeCompleto, 'pt-BR')
    );
    corpo.innerHTML = inscricoesOrdenadas.map((i) => `
      <tr>
        <td>${i.nomeCompleto}</td>
        <td>${new Date(i.dataNascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</td>
        <td>${i.escola}</td>
        <td>${i.responsavelProva}</td>
        <td class="celula-assinatura"></td>
      </tr>
    `).join('');
  }

  document.getElementById('btn-imprimir-lista').addEventListener('click', () => {
    popularImpressao();
    window.print();
  });

  // Se já tiver credenciais salvas nesta sessão, tenta entrar direto.
  (async function autoLogin() {
    if (!credenciais) return;
    const ok = await carregarDados();
    if (ok) {
      telaLogin.style.display = 'none';
      painel.style.display = '';
    } else {
      credenciais = null;
      sessionStorage.removeItem('eafi_admin_auth');
    }
  })();
})();
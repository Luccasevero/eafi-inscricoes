(function () {
  'use strict';

  const erroGeral = document.getElementById('erro-geral');
  const listaModalidades = document.getElementById('lista-modalidades');
  const cardResumoProva = document.getElementById('card-resumo-prova');
  const resumoProva = document.getElementById('resumo-prova');
  const cardResponsavelProva = document.getElementById('card-responsavel-prova');
  const selectResponsavelProva = document.getElementById('select-responsavel-prova');
  const btnConfirmar = document.getElementById('btn-confirmar');

  const etapa1Raw = sessionStorage.getItem('eafi_etapa1');
  if (!etapa1Raw) {
    // Sem dados da etapa 1: manda de volta.
    window.location.href = '/inscricao-etapa1.html';
    return;
  }
  const etapa1 = JSON.parse(etapa1Raw);
  document.getElementById('nome-candidato').textContent = etapa1.nomeCompleto || 'o candidato';

  let modalidadeSelecionadaId = null;

  const DATA_PROVA = { F: '19/09/2026', M: '20/09/2026' };
  const HORARIO_PROVA = '8h às 8:30h';
  const LOCAL_PROVA = 'SEDES - EMIEF Prof.ª Anna dos Reis Signorini, Av. Amador Bueno da Veiga, 220 - Jardim Jaraguá';
  const DATA_DIVULGACAO = '15/10/2026';

  function mostrarErro(msg) {
    erroGeral.textContent = msg;
    erroGeral.classList.add('visivel');
    erroGeral.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function sexoLabel(sexo) {
    if (sexo === 'AMBOS') return 'Feminino e Masculino';
    return sexo === 'F' ? 'Feminino' : 'Masculino';
  }

  async function carregarModalidades() {
    const url = `/api/modalidades?sexo=${encodeURIComponent(etapa1.sexo)}&dataNascimento=${encodeURIComponent(etapa1.dataNascimento)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      mostrarErro('Não foi possível carregar as modalidades. Tente recarregar a página.');
      return;
    }
    const modalidades = await resp.json();
    renderModalidades(modalidades);
  }

  function renderModalidades(modalidades) {
    listaModalidades.innerHTML = '';
    modalidades.forEach((m) => {
      const div = document.createElement('div');
      div.className = 'modalidade-card' + (m.elegivel ? '' : ' desabilitada');
      div.dataset.id = m.id;
      div.innerHTML = `
        <div>
          <div class="modalidade-nome">${m.nome}</div>
          <div class="modalidade-meta">${sexoLabel(m.sexo)} · Nascidos em ${m.anosPermitidos.join(', ')}</div>
        </div>
        <span class="badge ${m.elegivel ? 'badge-elegivel' : 'badge-indisponivel'}">
          ${m.elegivel ? 'Elegível' : 'Indisponível'}
        </span>
      `;
      if (m.elegivel) {
        div.addEventListener('click', () => selecionarModalidade(m, div));
      }
      listaModalidades.appendChild(div);
    });
  }

  function selecionarModalidade(m, div) {
    document.querySelectorAll('.modalidade-card').forEach((c) => c.classList.remove('selecionada'));
    div.classList.add('selecionada');
    modalidadeSelecionadaId = m.id;

    resumoProva.innerHTML = `
      <div class="item"><span>Data da prova</span><b>${DATA_PROVA[etapa1.sexo]}</b></div>
      <div class="item"><span>Horário de entrada</span><b>${HORARIO_PROVA}</b></div>
      <div class="item"><span>Local</span><b>${LOCAL_PROVA}</b></div>
      <div class="item"><span>Divulgação dos aprovados</span><b>${DATA_DIVULGACAO}</b></div>
    `;
    cardResumoProva.style.display = '';
    cardResponsavelProva.style.display = '';

    selectResponsavelProva.innerHTML = '<option value="">Selecione...</option>' +
      (etapa1.responsaveis || []).map((r, i) => `<option value="${i}">${r.nome} (${r.tipo})</option>`).join('');

    atualizarBotao();
    cardResumoProva.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function atualizarBotao() {
    btnConfirmar.disabled = !(modalidadeSelecionadaId && selectResponsavelProva.value !== '');
  }
  selectResponsavelProva.addEventListener('change', atualizarBotao);

  btnConfirmar.addEventListener('click', async () => {
    erroGeral.classList.remove('visivel');
    btnConfirmar.disabled = true;
    btnConfirmar.textContent = 'Enviando...';

    const payload = {
      ...etapa1,
      modalidadeId: modalidadeSelecionadaId,
      responsavelProvaIndex: Number(selectResponsavelProva.value)
    };

    try {
      const resp = await fetch('/api/inscricoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const dados = await resp.json();

      if (!resp.ok) {
        mostrarErro(dados.erro || 'Não foi possível concluir a inscrição.');
        btnConfirmar.disabled = false;
        btnConfirmar.textContent = 'Confirmar inscrição';
        return;
      }

      sessionStorage.setItem('eafi_confirmacao', JSON.stringify(dados));
      sessionStorage.removeItem('eafi_etapa1');
      sessionStorage.removeItem('eafi_etapa2');
      window.location.href = '/confirmacao.html';
    } catch (e) {
      mostrarErro('Erro de conexão. Verifique sua internet e tente novamente.');
      btnConfirmar.disabled = false;
      btnConfirmar.textContent = 'Confirmar inscrição';
    }
  });

  carregarModalidades();
})();

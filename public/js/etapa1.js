(function () {
  'use strict';

  const form = document.getElementById('form-etapa1');
  const erroGeral = document.getElementById('erro-geral');

  // ---------- Telefones (lista dinâmica) ----------
  const listaTelefones = document.getElementById('lista-telefones');
  let telefoneCount = 0;

  function addTelefoneLinha(valor) {
    telefoneCount++;
    const div = document.createElement('div');
    div.className = 'lista-dinamica-item';
    div.innerHTML = `
      <input type="tel" class="input-telefone" placeholder="(12) 90000-0000" value="${valor ? escapeHtml(valor) : ''}" required>
      <button type="button" class="btn-remover" title="Remover">×</button>
    `;
    div.querySelector('.btn-remover').addEventListener('click', () => {
      if (listaTelefones.children.length > 1) div.remove();
    });
    listaTelefones.appendChild(div);
  }

  document.getElementById('add-telefone').addEventListener('click', () => addTelefoneLinha());
  addTelefoneLinha(); // primeira linha obrigatória

  // ---------- Responsáveis (lista dinâmica) ----------
  const listaResponsaveis = document.getElementById('lista-responsaveis');

  function addResponsavelLinha() {
    const div = document.createElement('div');
    div.className = 'lista-dinamica-item';
    div.innerHTML = `
      <input type="text" class="input-resp-nome" placeholder="Nome do responsável" required>
      <select class="input-resp-tipo" required>
        <option value="">Tipo</option>
        <option value="Mãe">Mãe</option>
        <option value="Pai">Pai</option>
        <option value="Responsável legal">Responsável legal</option>
        <option value="Outro">Outro</option>
      </select>
      <input type="tel" class="input-resp-telefone" placeholder="Telefone (opcional)">
      <button type="button" class="btn-remover" title="Remover">×</button>
    `;
    div.querySelector('.btn-remover').addEventListener('click', () => {
      if (listaResponsaveis.children.length > 1) div.remove();
    });
    listaResponsaveis.appendChild(div);
  }

  document.getElementById('add-responsavel').addEventListener('click', addResponsavelLinha);
  addResponsavelLinha(); // primeira linha obrigatória

  // ---------- Campos condicionais (Sim/Não -> textarea/input) ----------
  function ligarCondicional(nomeRadio, idCondicional) {
    const radios = form.querySelectorAll(`input[name="${nomeRadio}"]`);
    const condicional = document.getElementById(idCondicional);
    function atualizar() {
      const marcado = form.querySelector(`input[name="${nomeRadio}"]:checked`);
      condicional.classList.toggle('visivel', !!marcado && marcado.value === 'sim');
    }
    radios.forEach((r) => r.addEventListener('change', atualizar));
    atualizar();
  }
  ligarCondicional('praticaEsportes', 'cond-praticaEsportes');
  ligarCondicional('deficiencia', 'cond-deficiencia');
  ligarCondicional('medicamento', 'cond-medicamento');
  ligarCondicional('convenio', 'cond-convenio');

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function mostrarErro(msg) {
    erroGeral.textContent = msg;
    erroGeral.classList.add('visivel');
    erroGeral.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ---------- Restaura dados salvos (ex: usuário voltou da Etapa 2) ----------
  (function restaurar() {
    const salvo = sessionStorage.getItem('eafi_etapa1');
    if (!salvo) return;
    try {
      const dados = JSON.parse(salvo);
      form.nomeCompleto.value = dados.nomeCompleto || '';
      form.dataNascimento.value = dados.dataNascimento || '';
      if (dados.sexo) form.querySelector(`input[name="sexo"][value="${dados.sexo}"]`).checked = true;
      form.email.value = dados.email || '';
      form.escola.value = dados.escola || '';
      form.anoEscolar.value = dados.anoEscolar || '';
      form.rua.value = dados.rua || '';
      form.numero.value = dados.numero || '';
      form.bairro.value = dados.bairro || '';
      form.cidade.value = dados.cidade || 'Taubaté';
      form.complemento.value = dados.complemento || '';

      if (Array.isArray(dados.telefones) && dados.telefones.length) {
        listaTelefones.innerHTML = '';
        dados.telefones.forEach((t) => addTelefoneLinha(t));
      }
      if (Array.isArray(dados.responsaveis) && dados.responsaveis.length) {
        listaResponsaveis.innerHTML = '';
        dados.responsaveis.forEach((r) => {
          addResponsavelLinha();
          const linha = listaResponsaveis.lastElementChild;
          linha.querySelector('.input-resp-nome').value = r.nome || '';
          linha.querySelector('.input-resp-tipo').value = r.tipo || '';
          linha.querySelector('.input-resp-telefone').value = r.telefone || '';
        });
      }
    } catch (e) { /* ignora dados corrompidos */ }
  })();

  // ---------- Submit ----------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    erroGeral.classList.remove('visivel');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const sexo = form.querySelector('input[name="sexo"]:checked')?.value;
    const autorizadoVal = form.querySelector('input[name="autorizado"]:checked')?.value;
    if (!sexo) return mostrarErro('Selecione o sexo do candidato.');
    if (!autorizadoVal) return mostrarErro('Informe se o candidato está autorizado a praticar esportes.');

    const telefones = Array.from(document.querySelectorAll('.input-telefone'))
      .map((i) => i.value.trim()).filter(Boolean);
    if (telefones.length === 0) return mostrarErro('Informe ao menos um telefone de contato.');

    const responsaveis = Array.from(listaResponsaveis.children).map((linha) => ({
      nome: linha.querySelector('.input-resp-nome').value.trim(),
      tipo: linha.querySelector('.input-resp-tipo').value,
      telefone: linha.querySelector('.input-resp-telefone').value.trim()
    }));
    if (responsaveis.some((r) => !r.nome || !r.tipo)) {
      return mostrarErro('Preencha nome e tipo de todos os responsáveis.');
    }

    const praticaEsportes = form.querySelector('input[name="praticaEsportes"]:checked')?.value === 'sim';
    const deficiencia = form.querySelector('input[name="deficiencia"]:checked')?.value === 'sim';
    const medicamento = form.querySelector('input[name="medicamento"]:checked')?.value === 'sim';
    const convenio = form.querySelector('input[name="convenio"]:checked')?.value === 'sim';

    const dados = {
      nomeCompleto: form.nomeCompleto.value.trim(),
      dataNascimento: form.dataNascimento.value,
      sexo,
      email: form.email.value.trim(),
      escola: form.escola.value.trim(),
      anoEscolar: form.anoEscolar.value.trim(),
      rua: form.rua.value.trim(),
      numero: form.numero.value.trim(),
      bairro: form.bairro.value.trim(),
      cidade: form.cidade.value.trim(),
      complemento: form.complemento.value.trim(),
      telefones,
      responsaveis,
      praticaEsportes,
      praticaEsportesDetalhe: form.praticaEsportesDetalhe.value.trim(),
      deficiencia,
      deficienciaDetalhe: form.deficienciaDetalhe.value.trim(),
      medicamento,
      medicamentoDetalhe: form.medicamentoDetalhe.value.trim(),
      convenio,
      convenioNome: form.convenioNome.value.trim(),
      autorizado: autorizadoVal === 'sim'
    };

    sessionStorage.setItem('eafi_etapa1', JSON.stringify(dados));
    // Limpa qualquer escolha de modalidade de uma tentativa anterior
    sessionStorage.removeItem('eafi_etapa2');
    window.location.href = '/inscricao-etapa2.html';
  });
})();

(function () {
  'use strict';
  const form = document.getElementById('form-consulta');
  const erroGeral = document.getElementById('erro-geral');
  const resultado = document.getElementById('resultado');

  function mostrarErro(msg) {
    erroGeral.textContent = msg;
    erroGeral.classList.add('visivel');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    erroGeral.classList.remove('visivel');
    resultado.innerHTML = '';

    const codigo = document.getElementById('codigo').value.trim();
    const email = document.getElementById('email').value.trim();
    const dataNascimento = document.getElementById('dataNascimento').value;

    let url;
    if (codigo) {
      url = `/api/inscricoes/consulta?codigo=${encodeURIComponent(codigo)}`;
    } else if (email && dataNascimento) {
      url = `/api/inscricoes/consulta?email=${encodeURIComponent(email)}&dataNascimento=${encodeURIComponent(dataNascimento)}`;
    } else {
      return mostrarErro('Informe o código de confirmação, ou o e-mail e a data de nascimento do candidato.');
    }

    const resp = await fetch(url);
    const dados = await resp.json();

    if (!resp.ok) {
      resultado.innerHTML = `<div class="card vazio"><p>${dados.erro || 'Nenhuma inscrição encontrada com esses dados.'}</p></div>`;
      return;
    }

    renderResumo(dados, resultado);
  });
})();

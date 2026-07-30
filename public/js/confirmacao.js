(function () {
  'use strict';
  const conteudo = document.getElementById('conteudo');
  const raw = sessionStorage.getItem('eafi_confirmacao');

  if (!raw) {
    conteudo.innerHTML = `
      <div class="card vazio">
        <p>Nenhuma inscrição recente encontrada nesta sessão.</p>
        <a href="/" class="btn btn-secondary">Voltar ao início</a>
      </div>`;
    return;
  }

  const dados = JSON.parse(raw);
  renderResumo(dados, conteudo);
})();

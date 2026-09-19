/*
  Lógica da tela de login.
  Usa o cliente do Supabase criado em js/banco.js (window.banco).
*/
(function () {
  "use strict";

  var formLogin = document.getElementById("formLogin");
  var campoEmail = document.getElementById("campoEmail");
  var campoSenha = document.getElementById("campoSenha");
  var btnEntrar = document.getElementById("btnEntrar");
  var btnEsqueci = document.getElementById("btnEsqueci");
  var faixaErro = document.getElementById("faixaErro");
  var faixaOk = document.getElementById("faixaOk");

  function mostrarErro(msg) {
    faixaOk.style.display = "none";
    faixaErro.textContent = msg;
    faixaErro.style.display = "flex";
  }
  function mostrarOk(msg) {
    faixaErro.style.display = "none";
    faixaOk.textContent = msg;
    faixaOk.style.display = "flex";
  }
  function esconderFaixas() {
    faixaErro.style.display = "none";
    faixaOk.style.display = "none";
  }

  // Se já existe uma sessão aberta, manda direto pro admin.
  async function checarSessaoExistente() {
    try {
      var resultado = await window.banco.auth.getSession();
      if (resultado.data && resultado.data.session) {
        window.location.href = "../admin/";
      }
    } catch (e) {
      // Se der erro de conexão aqui, só deixa a pessoa tentar logar normalmente.
    }
  }
  checarSessaoExistente();

  formLogin.addEventListener("submit", async function (e) {
    e.preventDefault();
    esconderFaixas();
    btnEntrar.disabled = true;
    btnEntrar.textContent = "Entrando...";

    try {
      var resultado = await window.banco.auth.signInWithPassword({
        email: campoEmail.value.trim(),
        password: campoSenha.value
      });

      if (resultado.error) {
        mostrarErro("E-mail ou senha incorretos.");
        btnEntrar.disabled = false;
        btnEntrar.textContent = "Entrar";
        return;
      }

      window.location.href = "../admin/";
    } catch (erroDeConexao) {
      mostrarErro("Não consegui falar com o banco de dados agora. Confira sua internet e tente de novo.");
      btnEntrar.disabled = false;
      btnEntrar.textContent = "Entrar";
    }
  });

  btnEsqueci.addEventListener("click", async function () {
    esconderFaixas();
    var email = campoEmail.value.trim();
    if (!email) {
      mostrarErro("Digite seu e-mail no campo acima primeiro, depois clique em \"Esqueci minha senha\".");
      return;
    }
    btnEsqueci.disabled = true;
    try {
      var enderecoDeVolta = window.location.origin + window.location.pathname;
      var resultado = await window.banco.auth.resetPasswordForEmail(email, {
        redirectTo: enderecoDeVolta
      });
      if (resultado.error) {
        mostrarErro("Não consegui enviar o e-mail de recuperação agora. Tente de novo em instantes.");
      } else {
        mostrarOk("Se esse e-mail existir na sua conta, chegou uma mensagem para trocar a senha.");
      }
    } catch (e) {
      mostrarErro("Não consegui falar com o banco de dados agora. Confira sua internet e tente de novo.");
    }
    btnEsqueci.disabled = false;
  });
})();

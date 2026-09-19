/*
  Painel admin da Evelyn Leite.
  Tudo em JavaScript puro, sem framework. Este arquivo cuida de:
  1) conferir a sessão antes de mostrar qualquer coisa
  2) carregar os dados do Supabase, tolerando tabelas ou campos faltando
  3) desenhar as 5 abas: Portfólio, Marcas, Calendário, Campanhas, Checklist
*/
(function () {
  "use strict";

  /* ============================================================
     0. FERRAMENTAS PEQUENAS, USADAS EM VÁRIOS LUGARES
     ============================================================ */

  function el(tag, className, html) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function escapeHtml(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function v(obj, campo, padrao) {
    if (!obj) return padrao;
    var val = obj[campo];
    return (val === null || val === undefined) ? padrao : val;
  }

  function formatarDataBR(dataTexto) {
    if (!dataTexto) return "";
    var partes = String(dataTexto).slice(0, 10).split("-");
    if (partes.length !== 3) return dataTexto;
    return partes[2] + "/" + partes[1] + "/" + partes[0];
  }

  function hojeISO() {
    var d = new Date();
    var mes = String(d.getMonth() + 1).padStart(2, "0");
    var dia = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + mes + "-" + dia;
  }

  function diasEntre(dataMenor, dataMaior) {
    var a = new Date(dataMenor + "T00:00:00");
    var b = new Date(dataMaior + "T00:00:00");
    return Math.round((b - a) / 86400000);
  }

  function formatarMoeda(numero) {
    var n = Number(numero) || 0;
    return "R$ " + n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function somenteDigitos(texto) {
    return String(texto || "").replace(/\D/g, "");
  }

  function linkWhatsapp(telefone) {
    var digitos = somenteDigitos(telefone);
    if (!digitos) return null;
    if (digitos.length <= 11) digitos = "55" + digitos;
    return "https://wa.me/" + digitos;
  }

  function linkInstagram(usuario) {
    if (!usuario) return null;
    var limpo = String(usuario).trim().replace(/^@/, "");
    if (!limpo) return null;
    return "https://instagram.com/" + limpo;
  }

  var ICONE = {
    editar: '<svg class="icone" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>',
    lixeira: '<svg class="icone" viewBox="0 0 24 24"><path d="M4 7h16"/><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><path d="M6 7l1 13a1.5 1.5 0 0 0 1.5 1.5h7A1.5 1.5 0 0 0 17 20l1-13"/></svg>',
    olho: '<svg class="icone" viewBox="0 0 24 24"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    olhoFechado: '<svg class="icone" viewBox="0 0 24 24"><path d="M3 3l18 18"/><path d="M10.6 5.2A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a15.7 15.7 0 0 1-3.1 4M6.5 6.6C4 8.3 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 4.1-.9"/><path d="M9.5 9.6a3 3 0 0 0 4.9 3.3"/></svg>',
    alcinha: '<svg class="icone" viewBox="0 0 24 24" style="stroke-width:2"><circle cx="9" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.1" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.1" fill="currentColor" stroke="none"/></svg>',
    mais: '<svg class="icone" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    baixar: '<svg class="icone" viewBox="0 0 24 24"><path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M4 20h16"/></svg>',
    busca: '<svg class="icone" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><line x1="20" y1="20" x2="15.3" y2="15.3"/></svg>',
    seta: '<svg class="icone" viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>',
    whatsapp: '<svg class="icone" viewBox="0 0 24 24" style="stroke:none;fill:currentColor;width:15px;height:15px;"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.39 1.26 4.81L2 22l5.44-1.36a9.9 9.9 0 0 0 4.6 1.13h.01c5.46 0 9.9-4.45 9.9-9.9C21.95 6.45 17.5 2 12.04 2zm5.8 14.02c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.06.28-3.56-.76-3-1.24-4.92-4.24-5.07-4.44-.15-.2-1.22-1.62-1.22-3.1 0-1.47.77-2.19 1.05-2.49.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.53.25.62.85 2.14.92 2.3.07.15.12.33.02.53-.1.2-.15.32-.3.5-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.3.76 1.27 1.64 2.06 1.13 1.02 2.08 1.34 2.38 1.49.3.15.47.13.65-.07.18-.2.75-.86.95-1.16.2-.3.4-.25.66-.15.27.1 1.72.82 2.01.97.3.15.5.23.57.36.07.13.07.75-.17 1.43z"/></svg>',
    instagram: '<svg class="icone" viewBox="0 0 24 24" style="stroke:none;fill:currentColor;width:15px;height:15px;"><path d="M12 2c2.72 0 3.06.01 4.12.06 1.06.05 1.79.22 2.43.47.66.26 1.22.6 1.77 1.15.55.55.9 1.11 1.15 1.77.25.64.42 1.37.47 2.43.05 1.06.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.06-.22 1.79-.47 2.43a4.9 4.9 0 0 1-1.15 1.77 4.9 4.9 0 0 1-1.77 1.15c-.64.25-1.37.42-2.43.47-1.06.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.06-.05-1.79-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.15 4.9 4.9 0 0 1-1.15-1.77c-.25-.64-.42-1.37-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.06.22-1.79.47-2.43.26-.66.6-1.22 1.15-1.77A4.9 4.9 0 0 1 5.45.53C6.09.28 6.82.11 7.88.06 8.94.01 9.28 0 12 0zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2A3.2 3.2 0 1 1 12 6.8a3.2 3.2 0 0 1 0 6.4zm5.4-8.4a1.17 1.17 0 1 1 0-2.34 1.17 1.17 0 0 1 0 2.34z"/></svg>'
  };

  /* ============================================================
     1. ESTADO GERAL DO PAINEL
     ============================================================ */
  var estado = {
    videos: [],
    marcas: [],
    calendario: [],
    campanhas: [],
    marcados: {},
    visitas: [],
    usuarioEmail: "",
    erros: []
  };

  var FUNIL_STATUS = ["Briefing", "Roteiro", "Aprovação Roteiro", "Gravação", "Edição", "Aprovado", "Entregue"];

  var abaAtual = "portfolio";

  /* ============================================================
     2. MODAL (usado por todas as abas)
     ============================================================ */
  function abrirModal(tituloHtml, corpoHtml, opts) {
    opts = opts || {};
    var area = document.getElementById("areaModais");
    area.innerHTML = "";
    var fundo = el("div", "modal-fundo");
    var caixa = el("div", "modal-caixa" + (opts.grande ? " modal-grande" : ""));
    caixa.innerHTML =
      '<div class="modal-topo"><h3>' + tituloHtml + '</h3>' +
      '<button class="modal-fechar" type="button" aria-label="Fechar" id="modalFecharBtn">&times;</button></div>' +
      '<div id="modalCorpo"></div>';
    fundo.appendChild(caixa);
    area.appendChild(fundo);
    document.getElementById("modalCorpo").innerHTML = corpoHtml;

    function fechar() { area.innerHTML = ""; document.removeEventListener("keydown", aoTeclar); }
    function aoTeclar(e) { if (e.key === "Escape") fechar(); }
    document.getElementById("modalFecharBtn").addEventListener("click", fechar);
    fundo.addEventListener("click", function (e) { if (e.target === fundo) fechar(); });
    document.addEventListener("keydown", aoTeclar);

    return { fechar: fechar, corpo: document.getElementById("modalCorpo") };
  }

  function confirmarExclusao(mensagem, aoConfirmar) {
    var m = abrirModal("Confirmar", "" +
      '<p style="font-size:13px;margin-bottom:18px;">' + escapeHtml(mensagem) + '</p>' +
      '<div class="modal-acoes">' +
      '<button class="btn btn-outline" id="btnCancelarExclusao">Cancelar</button>' +
      '<button class="btn btn-danger" id="btnConfirmarExclusao">Apagar</button>' +
      '</div>');
    m.corpo.querySelector("#btnCancelarExclusao").addEventListener("click", m.fechar);
    m.corpo.querySelector("#btnConfirmarExclusao").addEventListener("click", function () {
      m.fechar();
      aoConfirmar();
    });
  }

  /* ============================================================
     3. SESSÃO: a primeira coisa que este arquivo faz
     ============================================================ */
  async function iniciar() {
    var sessao = null;
    try {
      var resultado = await window.banco.auth.getSession();
      sessao = resultado.data ? resultado.data.session : null;
    } catch (e) {
      sessao = null;
    }

    if (!sessao) {
      window.location.href = "../login/";
      return;
    }

    estado.usuarioEmail = sessao.user && sessao.user.email ? sessao.user.email : "";

    // Só agora o painel aparece de verdade.
    document.getElementById("carregandoSessao").remove();
    document.getElementById("appAdmin").hidden = false;
    document.getElementById("emailUsuaria").textContent = estado.usuarioEmail;

    configurarMenu();
    configurarNavegacao();

    await carregarTudo();
    mostrarAvisoEstrutura();
    irParaAba("portfolio");
  }

  function configurarMenu() {
    var btn = document.getElementById("btnMenuToggle");
    var sidebar = document.getElementById("sidebar");
    var overlay = document.getElementById("overlayMenu");
    function fechar() {
      sidebar.classList.remove("aberta");
      overlay.classList.remove("ativa");
      btn.setAttribute("aria-expanded", "false");
    }
    btn.addEventListener("click", function () {
      var abrindo = !sidebar.classList.contains("aberta");
      sidebar.classList.toggle("aberta", abrindo);
      overlay.classList.toggle("ativa", abrindo);
      btn.setAttribute("aria-expanded", String(abrindo));
    });
    overlay.addEventListener("click", fechar);
    window.__fecharMenuMobile = fechar;

    document.getElementById("btnSair").addEventListener("click", async function () {
      try { await window.banco.auth.signOut(); } catch (e) {}
      window.location.href = "../login/";
    });
  }

  var TITULOS_ABA = {
    portfolio: ["Portfólio", "Como o seu site público está indo."],
    marcas: ["Marcas", "Sua base de contatos de empresa."],
    calendario: ["Calendário", "O que precisa ser gravado, editado e postado."],
    campanhas: ["Campanhas", "As campanhas fechadas com marcas."],
    checklist: ["Checklist", "O que fazer para seu portfólio vender mais."]
  };

  function configurarNavegacao() {
    var itens = document.querySelectorAll(".nav-item");
    itens.forEach(function (item) {
      item.addEventListener("click", function () {
        irParaAba(item.getAttribute("data-aba"));
        if (window.innerWidth <= 900 && window.__fecharMenuMobile) window.__fecharMenuMobile();
      });
    });
  }

  function irParaAba(nomeAba) {
    abaAtual = nomeAba;
    document.querySelectorAll(".nav-item").forEach(function (item) {
      item.classList.toggle("ativo", item.getAttribute("data-aba") === nomeAba);
    });
    document.querySelectorAll(".aba-conteudo").forEach(function (secao) { secao.hidden = true; });

    var mapaId = { portfolio: "abaPortfolio", marcas: "abaMarcas", calendario: "abaCalendario", campanhas: "abaCampanhas", checklist: "abaChecklist" };
    document.getElementById(mapaId[nomeAba]).hidden = false;

    document.getElementById("tituloAba").textContent = TITULOS_ABA[nomeAba][0];
    document.getElementById("subtituloAba").textContent = TITULOS_ABA[nomeAba][1];

    if (nomeAba === "portfolio") renderizarPortfolio();
    if (nomeAba === "marcas") renderizarMarcas();
    if (nomeAba === "calendario") renderizarCalendario();
    if (nomeAba === "campanhas") renderizarCampanhas();
    if (nomeAba === "checklist") renderizarChecklist();
  }

  /* ============================================================
     4. CARREGAMENTO DE DADOS, TOLERANTE A FALHA
     ============================================================ */
  async function carregarTabela(nomeTabela, montarConsulta) {
    try {
      var resultado = await montarConsulta();
      if (resultado.error) {
        estado.erros.push(nomeTabela + " (" + resultado.error.message + ")");
        return [];
      }
      return resultado.data || [];
    } catch (e) {
      estado.erros.push(nomeTabela + " (não consegui conectar)");
      return [];
    }
  }

  async function carregarTudo() {
    estado.erros = [];

    estado.videos = await carregarTabela("videos", function () {
      return window.banco.from("videos").select("*").order("ordem", { ascending: true });
    });
    estado.marcas = await carregarTabela("marcas", function () {
      return window.banco.from("marcas").select("*").order("criado_em", { ascending: false });
    });
    estado.calendario = await carregarTabela("calendario", function () {
      return window.banco.from("calendario").select("*").order("data", { ascending: true });
    });
    estado.campanhas = await carregarTabela("campanhas", function () {
      return window.banco.from("campanhas").select("*").order("criado_em", { ascending: false });
    });
    estado.visitas = await carregarTabela("visitas", function () {
      return window.banco.from("visitas").select("*").order("data", { ascending: false });
    });

    var marcadosLista = await carregarTabela("marcados", function () {
      return window.banco.from("marcados").select("*");
    });
    estado.marcados = {};
    marcadosLista.forEach(function (linha) { estado.marcados[linha.chave] = !!linha.marcado; });
  }

  function mostrarAvisoEstrutura() {
    var faixa = document.getElementById("avisoEstrutura");
    if (estado.erros.length === 0) {
      faixa.style.display = "none";
      return;
    }
    faixa.style.display = "flex";
    faixa.textContent = "Não consegui carregar: " + estado.erros.join(", ") +
      ". Confira se você já rodou o banco.sql no Supabase. O resto do painel continua funcionando normalmente.";
  }

  async function recarregar(nomeTabela) {
    if (nomeTabela === "videos") {
      estado.videos = await carregarTabela("videos", function () { return window.banco.from("videos").select("*").order("ordem", { ascending: true }); });
    } else if (nomeTabela === "marcas") {
      estado.marcas = await carregarTabela("marcas", function () { return window.banco.from("marcas").select("*").order("criado_em", { ascending: false }); });
    } else if (nomeTabela === "calendario") {
      estado.calendario = await carregarTabela("calendario", function () { return window.banco.from("calendario").select("*").order("data", { ascending: true }); });
    } else if (nomeTabela === "campanhas") {
      estado.campanhas = await carregarTabela("campanhas", function () { return window.banco.from("campanhas").select("*").order("criado_em", { ascending: false }); });
    }
  }

  /* ============================================================
     5. ABA: PORTFÓLIO
     ============================================================ */
  function renderizarPortfolio() {
    var raiz = document.getElementById("abaPortfolio");
    var hoje = hojeISO();

    var visitas14 = estado.visitas.filter(function (x) { return diasEntre(String(x.data).slice(0,10), hoje) <= 14 && diasEntre(String(x.data).slice(0,10), hoje) >= 0; });
    var visitasHoje = estado.visitas.filter(function (x) { return String(x.data).slice(0, 10) === hoje; });
    var videosNoAr = estado.videos.filter(function (x) { return v(x, "visivel", true); });

    var contagemNicho = {};
    videosNoAr.forEach(function (x) {
      var n = v(x, "nicho", "");
      if (!n) return;
      contagemNicho[n] = (contagemNicho[n] || 0) + 1;
    });
    var nichoMaisForte = "-";
    var maiorNicho = 0;
    Object.keys(contagemNicho).forEach(function (n) {
      if (contagemNicho[n] > maiorNicho) { maiorNicho = contagemNicho[n]; nichoMaisForte = n; }
    });

    var contagemOrigem = {};
    estado.visitas.forEach(function (x) {
      var o = v(x, "origem", "") || "direto";
      contagemOrigem[o] = (contagemOrigem[o] || 0) + 1;
    });
    var origensOrdenadas = Object.keys(contagemOrigem).sort(function (a, b) { return contagemOrigem[b] - contagemOrigem[a]; });
    var origemPrincipal = origensOrdenadas.length ? origensOrdenadas[0] : "-";

    var html = "";
    html += '<div class="kpi-faixa">' +
      '<div class="kpi-item"><div class="kpi-valor">' + visitas14.length + '</div><div class="kpi-label">Visitas em 14 dias</div></div>' +
      '<div class="kpi-item"><div class="kpi-valor">' + visitasHoje.length + '</div><div class="kpi-label">Visitas hoje</div></div>' +
      '<div class="kpi-item"><div class="kpi-valor">' + videosNoAr.length + '</div><div class="kpi-label">Vídeos no ar</div></div>' +
      '<div class="kpi-item"><div class="kpi-valor" style="font-size:1.05rem;">' + escapeHtml(nichoMaisForte) + '</div><div class="kpi-label">Nicho mais forte</div></div>' +
      '<div class="kpi-item"><div class="kpi-valor" style="font-size:1.05rem;">' + escapeHtml(origemPrincipal) + '</div><div class="kpi-label">De onde mais vêm</div></div>' +
      '</div>';

    html += '<div class="grade-2">';
    html += '<div class="painel-card"><h3>Visitas nos últimos 14 dias</h3><div id="graficoVisitas"></div></div>';
    html += '<div class="painel-card"><h3>De onde vêm</h3><div id="listaOrigens"></div></div>';
    html += '</div>';

    html += '<div class="painel-card">' +
      '<div class="barra-ferramentas"><h3 style="margin:0;">Meus vídeos</h3>' +
      '<button class="btn btn-primary" id="btnNovoVideo" style="margin-left:auto;">' + ICONE.mais + ' Adicionar vídeo</button></div>' +
      '<div id="tabelaVideos"></div>' +
      '</div>';

    raiz.innerHTML = html;

    renderizarGraficoVisitas(document.getElementById("graficoVisitas"));
    renderizarListaOrigens(document.getElementById("listaOrigens"), contagemOrigem, origensOrdenadas);
    renderizarTabelaVideos(document.getElementById("tabelaVideos"));

    document.getElementById("btnNovoVideo").addEventListener("click", function () { abrirFormularioVideo(null); });
  }

  function renderizarGraficoVisitas(destino) {
    if (estado.visitas.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Assim que as pessoas começarem a visitar seu portfólio, as visitas dos últimos 14 dias aparecem aqui em barrinhas, uma por dia.</div>';
      return;
    }
    var hoje = new Date();
    var dias = [];
    for (var i = 13; i >= 0; i--) {
      var d = new Date(hoje);
      d.setDate(d.getDate() - i);
      var iso = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
      dias.push({ iso: iso, label: String(d.getDate()).padStart(2, "0"), total: 0 });
    }
    estado.visitas.forEach(function (visita) {
      var isoVisita = String(visita.data).slice(0, 10);
      var achou = dias.find(function (dd) { return dd.iso === isoVisita; });
      if (achou) achou.total++;
    });
    var maximo = Math.max.apply(null, dias.map(function (dd) { return dd.total; }));
    if (maximo === 0) maximo = 1;

    var html = '<div class="grafico-barras">';
    dias.forEach(function (dd) {
      var alturaPct = Math.max(3, Math.round((dd.total / maximo) * 100));
      html += '<div class="barra-col" title="' + dd.total + ' visita(s)"><div class="barra" style="height:' + alturaPct + '%;"></div><div class="barra-dia">' + dd.label + '</div></div>';
    });
    html += '</div>';
    destino.innerHTML = html;
  }

  function renderizarListaOrigens(destino, contagem, ordenadas) {
    if (estado.visitas.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Aqui vai aparecer de onde as pessoas chegaram até o seu portfólio (Instagram, TikTok, direto etc), assim que houver visitas.</div>';
      return;
    }
    var maximo = contagem[ordenadas[0]] || 1;
    var html = '<div class="lista-origens">';
    ordenadas.slice(0, 6).forEach(function (origem) {
      var qtd = contagem[origem];
      var pct = Math.max(4, Math.round((qtd / maximo) * 100));
      html += '<div class="origem-linha"><span class="origem-nome" title="' + escapeHtml(origem) + '">' + escapeHtml(origem) + '</span>' +
        '<span class="origem-barra-fundo"><span class="origem-barra" style="width:' + pct + '%;"></span></span>' +
        '<span class="origem-qtd">' + qtd + '</span></div>';
    });
    html += '</div>';
    destino.innerHTML = html;
  }

  var arrastandoVideoId = null;

  function renderizarTabelaVideos(destino) {
    if (estado.videos.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Você ainda não tem vídeos cadastrados. Clique em "Adicionar vídeo" para começar.</div>';
      return;
    }
    var lista = estado.videos.slice().sort(function (a, b) { return v(a, "ordem", 0) - v(b, "ordem", 0); });

    var html = '<div class="tabela-wrap"><table class="tabela"><thead><tr>' +
      '<th></th><th>Título</th><th>Nicho</th><th>Formato</th><th>Marca</th><th>Destaque</th><th>Mostrar</th><th></th>' +
      '</tr></thead><tbody id="corpoTabelaVideos"></tbody></table></div>';
    destino.innerHTML = html;

    var corpo = document.getElementById("corpoTabelaVideos");
    lista.forEach(function (video) {
      var tr = el("tr");
      tr.setAttribute("draggable", "true");
      tr.dataset.id = video.id;
      var visivel = v(video, "visivel", true);
      tr.innerHTML =
        '<td>' + ICONE.alcinha + '</td>' +
        '<td class="celula-truncada" title="' + escapeHtml(v(video, "titulo", "")) + '">' + escapeHtml(v(video, "titulo", "(sem título)")) + '</td>' +
        '<td>' + escapeHtml(v(video, "nicho", "-")) + '</td>' +
        '<td>' + escapeHtml(v(video, "formato", "-")) + '</td>' +
        '<td>' + escapeHtml(v(video, "marca", "-")) + '</td>' +
        '<td>' + escapeHtml(v(video, "destaque", "-")) + '</td>' +
        '<td><button class="olho-btn ' + (visivel ? "" : "escondido") + '" data-acao="olho" data-id="' + video.id + '">' + (visivel ? ICONE.olho : ICONE.olhoFechado) + '</button></td>' +
        '<td><button class="btn-icon" data-acao="editar" data-id="' + video.id + '" title="Editar">' + ICONE.editar + '</button>' +
        '<button class="btn-icon" data-acao="apagar" data-id="' + video.id + '" title="Apagar">' + ICONE.lixeira + '</button></td>';
      corpo.appendChild(tr);
    });

    corpo.querySelectorAll('[data-acao="olho"]').forEach(function (btn) {
      btn.addEventListener("click", async function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        var video = estado.videos.find(function (x) { return String(x.id) === String(id); });
        if (!video) return;
        var novoValor = !v(video, "visivel", true);
        try {
          await window.banco.from("videos").update({ visivel: novoValor }).eq("id", id);
          video.visivel = novoValor;
          renderizarTabelaVideos(destino);
        } catch (err) { alert("Não consegui atualizar agora. Tente de novo."); }
      });
    });
    corpo.querySelectorAll('[data-acao="editar"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        var video = estado.videos.find(function (x) { return String(x.id) === String(id); });
        abrirFormularioVideo(video);
      });
    });
    corpo.querySelectorAll('[data-acao="apagar"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        confirmarExclusao("Apagar este vídeo do portfólio?", async function () {
          try {
            await window.banco.from("videos").delete().eq("id", id);
            await recarregar("videos");
            renderizarPortfolio();
          } catch (err) { alert("Não consegui apagar agora. Tente de novo."); }
        });
      });
    });

    // Arrastar pela alcinha pra reordenar
    corpo.querySelectorAll("tr").forEach(function (tr) {
      tr.addEventListener("dragstart", function () {
        arrastandoVideoId = tr.dataset.id;
        tr.classList.add("arrastando");
      });
      tr.addEventListener("dragend", function () {
        tr.classList.remove("arrastando");
        corpo.querySelectorAll("tr").forEach(function (x) { x.classList.remove("linha-drop-alvo"); });
      });
      tr.addEventListener("dragover", function (e) {
        e.preventDefault();
        tr.classList.add("linha-drop-alvo");
      });
      tr.addEventListener("dragleave", function () { tr.classList.remove("linha-drop-alvo"); });
      tr.addEventListener("drop", async function (e) {
        e.preventDefault();
        tr.classList.remove("linha-drop-alvo");
        var idAlvo = tr.dataset.id;
        if (!arrastandoVideoId || idAlvo === arrastandoVideoId) return;

        var novaLista = estado.videos.slice().sort(function (a, b) { return v(a, "ordem", 0) - v(b, "ordem", 0); });
        var origemIdx = novaLista.findIndex(function (x) { return String(x.id) === String(arrastandoVideoId); });
        var alvoIdx = novaLista.findIndex(function (x) { return String(x.id) === String(idAlvo); });
        if (origemIdx < 0 || alvoIdx < 0) return;
        var item = novaLista.splice(origemIdx, 1)[0];
        novaLista.splice(alvoIdx, 0, item);

        novaLista.forEach(function (item, i) { item.ordem = i; });
        estado.videos = novaLista;
        renderizarTabelaVideos(destino);

        try {
          await Promise.all(novaLista.map(function (item, i) {
            return window.banco.from("videos").update({ ordem: i }).eq("id", item.id);
          }));
        } catch (err) { /* se falhar, na próxima carregada volta ao que está salvo */ }
      });
    });
  }

  function abrirFormularioVideo(video) {
    var editando = !!video;
    var corpo = '<form id="formVideo">' +
      '<div class="campo"><label for="fvTitulo">Título</label><input id="fvTitulo" required value="' + escapeHtml(v(video, "titulo", "")) + '"></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fvNicho">Nicho</label><input id="fvNicho" value="' + escapeHtml(v(video, "nicho", "")) + '"></div>' +
      '<div class="campo"><label for="fvFormato">Formato</label><select id="fvFormato">' +
      '<option value="4:5"' + (v(video, "formato", "4:5") === "4:5" ? " selected" : "") + '>4:5 (galeria de trabalhos)</option>' +
      '<option value="9:16"' + (v(video, "formato", "") === "9:16" ? " selected" : "") + '>9:16 (aparece nos destaques)</option>' +
      '</select></div></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fvMarca">Marca</label><input id="fvMarca" value="' + escapeHtml(v(video, "marca", "")) + '"></div>' +
      '<div class="campo"><label for="fvDestaque">Número de destaque</label><input id="fvDestaque" placeholder="ex: +2,4M views" value="' + escapeHtml(v(video, "destaque", "")) + '"></div></div>' +
      '<div class="campo"><label for="fvLink">Link do vídeo</label><input id="fvLink" placeholder="https://" value="' + escapeHtml(v(video, "link", "")) + '"></div>' +
      '<div class="campo"><label for="fvCapa">Foto de capa (link da imagem)</label><input id="fvCapa" placeholder="https:// ou fotos/algumacoisa.jpg" value="' + escapeHtml(v(video, "capa", "")) + '"></div>' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-top:4px;"><input type="checkbox" id="fvVisivel" ' + (v(video, "visivel", true) ? "checked" : "") + ' style="accent-color:var(--magenta);width:16px;height:16px;"> Aparece no site público agora</label>' +
      '<div class="modal-acoes">' +
      (editando ? '<button type="button" class="btn btn-danger empurrar-esquerda" id="fvApagar">Apagar</button>' : '') +
      '<button type="button" class="btn btn-outline" id="fvCancelar">Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">Salvar</button>' +
      '</div></form>';

    var m = abrirModal(editando ? "Editar vídeo" : "Novo vídeo", corpo);
    m.corpo.querySelector("#fvCancelar").addEventListener("click", m.fechar);
    if (editando) {
      m.corpo.querySelector("#fvApagar").addEventListener("click", function () {
        m.fechar();
        confirmarExclusao("Apagar este vídeo do portfólio?", async function () {
          try {
            await window.banco.from("videos").delete().eq("id", video.id);
            await recarregar("videos");
            renderizarPortfolio();
          } catch (err) { alert("Não consegui apagar agora."); }
        });
      });
    }
    m.corpo.querySelector("#formVideo").addEventListener("submit", async function (e) {
      e.preventDefault();
      var objeto = {
        titulo: m.corpo.querySelector("#fvTitulo").value.trim(),
        nicho: m.corpo.querySelector("#fvNicho").value.trim(),
        formato: m.corpo.querySelector("#fvFormato").value,
        marca: m.corpo.querySelector("#fvMarca").value.trim(),
        destaque: m.corpo.querySelector("#fvDestaque").value.trim(),
        link: m.corpo.querySelector("#fvLink").value.trim(),
        capa: m.corpo.querySelector("#fvCapa").value.trim(),
        visivel: m.corpo.querySelector("#fvVisivel").checked
      };
      try {
        if (editando) {
          await window.banco.from("videos").update(objeto).eq("id", video.id);
        } else {
          objeto.ordem = estado.videos.length ? Math.max.apply(null, estado.videos.map(function (x) { return v(x, "ordem", 0); })) + 1 : 0;
          await window.banco.from("videos").insert(objeto);
        }
        m.fechar();
        await recarregar("videos");
        renderizarPortfolio();
      } catch (err) { alert("Não consegui salvar agora. Tente de novo."); }
    });
  }

  /* ============================================================
     6. ABA: MARCAS
     ============================================================ */
  var filtroSituacaoAtual = "Todas";
  var buscaMarcasAtual = "";

  var CORES_SITUACAO = {
    "Lead": "background:var(--azul-claro);color:var(--azul);",
    "Conversando": "background:var(--pessego-claro);color:#8a5a1f;",
    "Cliente": "background:var(--rosa-claro);color:var(--magenta);",
    "Parada": "background:var(--creme);color:var(--texto-suave);"
  };

  function renderizarMarcas() {
    var raiz = document.getElementById("abaMarcas");
    var html = '<div class="painel-card">';
    html += '<div class="barra-ferramentas">';
    html += '<div class="busca"><input type="text" id="buscaMarcas" placeholder="Buscar por nome, @ ou e-mail" value="' + escapeHtml(buscaMarcasAtual) + '"></div>';
    html += '<div class="filtro-pilulas" id="filtroSituacao">';
    ["Todas", "Lead", "Conversando", "Cliente", "Parada"].forEach(function (s) {
      html += '<button class="filtro-pilula' + (filtroSituacaoAtual === s ? " ativa" : "") + '" data-situacao="' + s + '">' + s + '</button>';
    });
    html += '</div>';
    html += '<button class="btn btn-outline" id="btnBaixarMarcas">' + ICONE.baixar + ' Baixar CSV</button>';
    html += '<button class="btn btn-primary" id="btnNovaMarca">' + ICONE.mais + ' Adicionar</button>';
    html += '</div>';
    html += '<div id="tabelaMarcas"></div>';
    html += '</div>';
    raiz.innerHTML = html;

    document.getElementById("buscaMarcas").addEventListener("input", function (e) {
      buscaMarcasAtual = e.target.value;
      renderizarTabelaMarcas();
    });
    document.querySelectorAll('#filtroSituacao .filtro-pilula').forEach(function (btn) {
      btn.addEventListener("click", function () {
        filtroSituacaoAtual = btn.getAttribute("data-situacao");
        document.querySelectorAll('#filtroSituacao .filtro-pilula').forEach(function (b) { b.classList.remove("ativa"); });
        btn.classList.add("ativa");
        renderizarTabelaMarcas();
      });
    });
    document.getElementById("btnNovaMarca").addEventListener("click", function () { abrirFormularioMarca(null); });
    document.getElementById("btnBaixarMarcas").addEventListener("click", baixarCsvMarcas);

    renderizarTabelaMarcas();
  }

  function marcasFiltradas() {
    var termo = buscaMarcasAtual.trim().toLowerCase();
    return estado.marcas.filter(function (m) {
      if (filtroSituacaoAtual !== "Todas" && v(m, "situacao", "Lead") !== filtroSituacaoAtual) return false;
      if (!termo) return true;
      var alvo = (v(m, "nome", "") + " " + v(m, "instagram", "") + " " + v(m, "email", "")).toLowerCase();
      return alvo.indexOf(termo) !== -1;
    });
  }

  function renderizarTabelaMarcas() {
    var destino = document.getElementById("tabelaMarcas");
    var lista = marcasFiltradas();
    if (estado.marcas.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Você ainda não tem marcas cadastradas. Elas aparecem aqui sozinhas quando alguém preenche o formulário do seu portfólio, ou você pode adicionar na mão.</div>';
      return;
    }
    if (lista.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Nenhuma marca encontrada com esse filtro.</div>';
      return;
    }
    var html = '<div class="tabela-wrap"><table class="tabela"><thead><tr>' +
      '<th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th><th></th>' +
      '</tr></thead><tbody id="corpoTabelaMarcas"></tbody></table></div>';
    destino.innerHTML = html;
    var corpo = document.getElementById("corpoTabelaMarcas");

    lista.forEach(function (m) {
      var tr = el("tr");
      var estiloSituacao = CORES_SITUACAO[v(m, "situacao", "Lead")] || CORES_SITUACAO["Lead"];
      var wa = linkWhatsapp(v(m, "telefone", ""));
      var ig = linkInstagram(v(m, "instagram", ""));
      tr.innerHTML =
        '<td>' + escapeHtml(v(m, "nome", "-")) + '</td>' +
        '<td>' + (ig ? '<a href="' + ig + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;color:var(--magenta);" onclick="event.stopPropagation()">' + ICONE.instagram + escapeHtml(v(m, "instagram", "")) + '</a>' : escapeHtml(v(m, "instagram", "-"))) + '</td>' +
        '<td>' + escapeHtml(v(m, "email", "-")) + '</td>' +
        '<td>' + (wa ? '<a href="' + wa + '" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;color:var(--sucesso);" onclick="event.stopPropagation()">' + ICONE.whatsapp + escapeHtml(v(m, "telefone", "")) + '</a>' : escapeHtml(v(m, "telefone", "-"))) + '</td>' +
        '<td><span class="pilula" style="' + estiloSituacao + '">' + escapeHtml(v(m, "situacao", "Lead")) + '</span></td>' +
        '<td class="celula-truncada" title="' + escapeHtml(v(m, "obs", "")) + '">' + escapeHtml(v(m, "obs", "-")) + '</td>' +
        '<td>' + (v(m, "ultimo_contato", "") ? formatarDataBR(m.ultimo_contato) : "-") + '</td>' +
        '<td><button class="btn-icon" data-acao="apagar" data-id="' + m.id + '" title="Apagar">' + ICONE.lixeira + '</button></td>';
      tr.addEventListener("click", function () { abrirFormularioMarca(m); });
      corpo.appendChild(tr);
    });

    corpo.querySelectorAll('[data-acao="apagar"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        confirmarExclusao("Apagar esta marca da sua base?", async function () {
          try {
            await window.banco.from("marcas").delete().eq("id", id);
            await recarregar("marcas");
            renderizarTabelaMarcas();
          } catch (err) { alert("Não consegui apagar agora."); }
        });
      });
    });
  }

  function abrirFormularioMarca(marca) {
    var editando = !!marca;
    var situacaoAtual = v(marca, "situacao", "Lead");
    var corpo = '<form id="formMarca">' +
      '<div class="campo"><label for="fmNome">Marca</label><input id="fmNome" required value="' + escapeHtml(v(marca, "nome", "")) + '"></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fmInstagram">Instagram</label><input id="fmInstagram" placeholder="@marca" value="' + escapeHtml(v(marca, "instagram", "")) + '"></div>' +
      '<div class="campo"><label for="fmTelefone">Telefone</label><input id="fmTelefone" value="' + escapeHtml(v(marca, "telefone", "")) + '"></div></div>' +
      '<div class="campo"><label for="fmEmail">E-mail</label><input id="fmEmail" type="email" value="' + escapeHtml(v(marca, "email", "")) + '"></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fmSituacao">Situação</label><select id="fmSituacao">' +
      ["Lead", "Conversando", "Cliente", "Parada"].map(function (s) { return '<option value="' + s + '"' + (situacaoAtual === s ? " selected" : "") + '>' + s + '</option>'; }).join("") +
      '</select></div>' +
      '<div class="campo"><label for="fmUltimoContato">Último contato</label><input id="fmUltimoContato" type="date" value="' + (v(marca, "ultimo_contato", "") || "") + '"></div></div>' +
      '<div class="campo"><label for="fmObs">Observação</label><textarea id="fmObs">' + escapeHtml(v(marca, "obs", "")) + '</textarea></div>' +
      '<div class="modal-acoes">' +
      (editando ? '<button type="button" class="btn btn-danger empurrar-esquerda" id="fmApagar">Apagar</button>' : '') +
      '<button type="button" class="btn btn-outline" id="fmCancelar">Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">Salvar</button>' +
      '</div></form>';

    var m = abrirModal(editando ? "Editar marca" : "Nova marca", corpo);
    m.corpo.querySelector("#fmCancelar").addEventListener("click", m.fechar);
    if (editando) {
      m.corpo.querySelector("#fmApagar").addEventListener("click", function () {
        m.fechar();
        confirmarExclusao("Apagar esta marca da sua base?", async function () {
          try {
            await window.banco.from("marcas").delete().eq("id", marca.id);
            await recarregar("marcas");
            renderizarTabelaMarcas();
          } catch (err) { alert("Não consegui apagar agora."); }
        });
      });
    }
    m.corpo.querySelector("#formMarca").addEventListener("submit", async function (e) {
      e.preventDefault();
      var objeto = {
        nome: m.corpo.querySelector("#fmNome").value.trim(),
        instagram: m.corpo.querySelector("#fmInstagram").value.trim(),
        telefone: m.corpo.querySelector("#fmTelefone").value.trim(),
        email: m.corpo.querySelector("#fmEmail").value.trim(),
        situacao: m.corpo.querySelector("#fmSituacao").value,
        ultimo_contato: m.corpo.querySelector("#fmUltimoContato").value || null,
        obs: m.corpo.querySelector("#fmObs").value.trim()
      };
      try {
        if (editando) {
          await window.banco.from("marcas").update(objeto).eq("id", marca.id);
        } else {
          await window.banco.from("marcas").insert(objeto);
        }
        m.fechar();
        await recarregar("marcas");
        renderizarTabelaMarcas();
      } catch (err) { alert("Não consegui salvar agora. Tente de novo."); }
    });
  }

  function paraCampoCsv(texto) {
    var t = String(texto === null || texto === undefined ? "" : texto);
    if (t.indexOf(";") !== -1 || t.indexOf('"') !== -1 || t.indexOf("\n") !== -1) {
      t = '"' + t.replace(/"/g, '""') + '"';
    }
    return t;
  }

  function baixarArquivoCsv(nomeArquivo, cabecalhos, linhas) {
    var conteudo = cabecalhos.join(";") + "\n";
    linhas.forEach(function (linha) { conteudo += linha.map(paraCampoCsv).join(";") + "\n"; });
    var bom = "﻿"; // faz o Excel entender os acentos certinho
    var blob = new Blob([bom + conteudo], { type: "text/csv;charset=utf-8;" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function baixarCsvMarcas() {
    var lista = marcasFiltradas();
    baixarArquivoCsv("marcas.csv",
      ["Marca", "Instagram", "E-mail", "Telefone", "Situação", "Observação", "Último contato"],
      lista.map(function (m) {
        return [v(m, "nome", ""), v(m, "instagram", ""), v(m, "email", ""), v(m, "telefone", ""), v(m, "situacao", ""), v(m, "obs", ""), formatarDataBR(v(m, "ultimo_contato", ""))];
      }));
  }

  /* ============================================================
     7. ABA: CALENDÁRIO
     ============================================================ */
  var calMesAtual = new Date().getMonth();
  var calAnoAtual = new Date().getFullYear();
  var calFiltroTipo = "Todos";
  var NOMES_MES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var NOMES_DIA_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  function renderizarCalendario() {
    var raiz = document.getElementById("abaCalendario");
    var html = '<div class="painel-card">';
    html += '<div class="calendario-topo">';
    html += '<div class="filtro-pilulas" id="filtroTipoCal">';
    ["Todos", "gravar", "editar", "postar"].forEach(function (t) {
      html += '<button class="filtro-pilula' + (calFiltroTipo === t ? " ativa" : "") + '" data-tipo="' + t + '">' + (t === "Todos" ? "Todos" : t.charAt(0).toUpperCase() + t.slice(1)) + '</button>';
    });
    html += '</div>';
    html += '<div class="calendario-nav">' +
      '<button class="btn-icon" id="calMesAnterior" aria-label="Mês anterior">' + ICONE.seta + '</button>' +
      '<h3 id="calTituloMes"></h3>' +
      '<button class="btn-icon" id="calMesProximo" aria-label="Próximo mês" style="transform:scaleX(-1);">' + ICONE.seta + '</button>' +
      '</div>';
    html += '<button class="btn btn-outline btn-sm" id="calEsteMes">Este mês</button>';
    html += '</div>';
    html += '<div class="grade-calendario" id="gradeCalendario"></div>';
    html += '</div>';
    html += '<div class="painel-card bloco-atrasados"><h3>Ficou pra trás</h3><div id="listaAtrasados"></div></div>';
    raiz.innerHTML = html;

    document.querySelectorAll('#filtroTipoCal .filtro-pilula').forEach(function (btn) {
      btn.addEventListener("click", function () {
        calFiltroTipo = btn.getAttribute("data-tipo");
        document.querySelectorAll('#filtroTipoCal .filtro-pilula').forEach(function (b) { b.classList.remove("ativa"); });
        btn.classList.add("ativa");
        desenharGradeCalendario();
      });
    });
    document.getElementById("calMesAnterior").addEventListener("click", function () {
      calMesAtual--; if (calMesAtual < 0) { calMesAtual = 11; calAnoAtual--; }
      desenharGradeCalendario();
    });
    document.getElementById("calMesProximo").addEventListener("click", function () {
      calMesAtual++; if (calMesAtual > 11) { calMesAtual = 0; calAnoAtual++; }
      desenharGradeCalendario();
    });
    document.getElementById("calEsteMes").addEventListener("click", function () {
      calMesAtual = new Date().getMonth(); calAnoAtual = new Date().getFullYear();
      desenharGradeCalendario();
    });

    desenharGradeCalendario();
    desenharAtrasados();
  }

  function itensDoDia(isoData) {
    var lista = [];
    estado.calendario.forEach(function (item) {
      if (String(v(item, "data", "")).slice(0, 10) !== isoData) return;
      if (calFiltroTipo !== "Todos" && v(item, "tipo", "") !== calFiltroTipo) return;
      lista.push({
        titulo: v(item, "titulo", "(sem título)"),
        tipo: v(item, "tipo", "gravar"),
        feito: v(item, "status", "a fazer") === "feito",
        campanha: false
      });
    });
    estado.campanhas.forEach(function (camp) {
      if (String(v(camp, "prazo", "")).slice(0, 10) !== isoData) return;
      lista.push({ titulo: "Prazo: " + v(camp, "campanha", "(sem nome)"), tipo: "campanha", feito: false, campanha: true });
    });
    return lista;
  }

  function desenharGradeCalendario() {
    document.getElementById("calTituloMes").textContent = NOMES_MES[calMesAtual] + " de " + calAnoAtual;
    var grade = document.getElementById("gradeCalendario");
    grade.innerHTML = "";
    NOMES_DIA_SEMANA.forEach(function (nome) { grade.appendChild(el("div", "dia-semana-nome", nome)); });

    var primeiroDoMes = new Date(calAnoAtual, calMesAtual, 1);
    var diaSemanaPrimeiro = (primeiroDoMes.getDay() + 6) % 7; // 0 = segunda
    var diasNoMes = new Date(calAnoAtual, calMesAtual + 1, 0).getDate();
    var diasMesAnterior = new Date(calAnoAtual, calMesAtual, 0).getDate();

    var celulas = [];
    for (var i = diaSemanaPrimeiro - 1; i >= 0; i--) {
      celulas.push({ numero: diasMesAnterior - i, foraDoMes: true, mes: calMesAtual - 1, ano: calAnoAtual });
    }
    for (var d = 1; d <= diasNoMes; d++) {
      celulas.push({ numero: d, foraDoMes: false, mes: calMesAtual, ano: calAnoAtual });
    }
    while (celulas.length % 7 !== 0) {
      var proximoNum = celulas.length - (diaSemanaPrimeiro + diasNoMes) + 1;
      celulas.push({ numero: proximoNum, foraDoMes: true, mes: calMesAtual + 1, ano: calAnoAtual });
    }

    var hojeIso = hojeISO();

    celulas.forEach(function (c) {
      var mesReal = ((c.mes % 12) + 12) % 12;
      var anoReal = c.ano + Math.floor(c.mes / 12);
      var iso = anoReal + "-" + String(mesReal + 1).padStart(2, "0") + "-" + String(c.numero).padStart(2, "0");
      var ehHoje = iso === hojeIso;

      var celula = el("div", "dia-celula" + (c.foraDoMes ? " fora-do-mes" : "") + (ehHoje ? " hoje" : ""));
      celula.appendChild(el("div", "dia-numero", c.numero));

      var itens = itensDoDia(iso);
      var mostrar = itens.slice(0, 3);
      mostrar.forEach(function (item) {
        var classeTipo = item.campanha ? "item-campanha" : "tipo-" + item.tipo;
        var div = el("div", "dia-item " + classeTipo + (item.feito ? " feito" : ""), escapeHtml(item.titulo));
        div.title = item.titulo;
        celula.appendChild(div);
      });
      if (itens.length > 3) {
        var maisBtn = el("button", "dia-mais", "+" + (itens.length - 3) + " mais");
        maisBtn.addEventListener("click", function (e) { e.stopPropagation(); abrirDetalheDia(iso, itens); });
        celula.appendChild(maisBtn);
      }

      var addBtn = el("button", "dia-add-btn", "+");
      addBtn.setAttribute("aria-label", "Adicionar em " + iso);
      addBtn.addEventListener("click", function (e) { e.stopPropagation(); abrirFormularioCalendario(null, iso); });
      celula.appendChild(addBtn);

      celula.addEventListener("click", function () { abrirFormularioCalendario(null, iso); });

      grade.appendChild(celula);
    });
  }

  function abrirDetalheDia(iso, itens) {
    var corpo = '<div style="display:flex;flex-direction:column;gap:8px;">';
    itens.forEach(function (item) {
      var classeTipo = item.campanha ? "item-campanha" : "tipo-" + item.tipo;
      corpo += '<div class="dia-item ' + classeTipo + (item.feito ? " feito" : "") + '" style="white-space:normal;font-size:12.5px;padding:8px 10px;">' + escapeHtml(item.titulo) + '</div>';
    });
    corpo += '</div><div class="modal-acoes"><button class="btn btn-outline" id="fecharDetalheDia">Fechar</button></div>';
    var m = abrirModal(formatarDataBR(iso), corpo);
    m.corpo.querySelector("#fecharDetalheDia").addEventListener("click", m.fechar);
  }

  function desenharAtrasados() {
    var destino = document.getElementById("listaAtrasados");
    var hoje = hojeISO();
    var atrasados = estado.calendario.filter(function (item) {
      return v(item, "status", "a fazer") === "a fazer" && String(v(item, "data", "")).slice(0, 10) < hoje;
    }).sort(function (a, b) { return String(a.data).localeCompare(String(b.data)); });

    if (atrasados.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Nada atrasado. Você está em dia com a sua rotina.</div>';
      return;
    }
    var html = "";
    atrasados.forEach(function (item) {
      var dias = diasEntre(String(item.data).slice(0, 10), hoje);
      html += '<div class="item-atrasado"><span class="info"><b>' + escapeHtml(v(item, "titulo", "")) + '</b>' +
        (v(item, "marca", "") ? " · " + escapeHtml(item.marca) : "") + '</span>' +
        '<span class="dias-atraso">há ' + dias + (dias === 1 ? " dia" : " dias") + '</span></div>';
    });
    destino.innerHTML = html;
  }

  function abrirFormularioCalendario(item, dataPreenchida) {
    var editando = !!item;
    var corpo = '<form id="formCal">' +
      '<div class="campo"><label for="fcTitulo">Título</label><input id="fcTitulo" required value="' + escapeHtml(v(item, "titulo", "")) + '"></div>' +
      '<div class="campo"><label for="fcMarca">Marca</label><input id="fcMarca" value="' + escapeHtml(v(item, "marca", "")) + '"></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fcTipo">Tipo</label><select id="fcTipo">' +
      ["gravar", "editar", "postar"].map(function (t) { return '<option value="' + t + '"' + (v(item, "tipo", "gravar") === t ? " selected" : "") + '>' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>'; }).join("") +
      '</select></div>' +
      '<div class="campo"><label for="fcData">Data</label><input id="fcData" type="date" required value="' + (v(item, "data", "") || dataPreenchida || hojeISO()) + '"></div></div>' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="checkbox" id="fcFeito" ' + (v(item, "status", "a fazer") === "feito" ? "checked" : "") + ' style="accent-color:var(--magenta);width:16px;height:16px;"> Já está feito</label>' +
      '<div class="modal-acoes">' +
      (editando ? '<button type="button" class="btn btn-danger empurrar-esquerda" id="fcApagar">Apagar</button>' : '') +
      '<button type="button" class="btn btn-outline" id="fcCancelar">Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">Salvar</button>' +
      '</div></form>';

    var m = abrirModal(editando ? "Editar item" : "Novo item no calendário", corpo);
    m.corpo.querySelector("#fcCancelar").addEventListener("click", m.fechar);
    if (editando) {
      m.corpo.querySelector("#fcApagar").addEventListener("click", function () {
        m.fechar();
        confirmarExclusao("Apagar este item do calendário?", async function () {
          try {
            await window.banco.from("calendario").delete().eq("id", item.id);
            await recarregar("calendario");
            desenharGradeCalendario(); desenharAtrasados();
          } catch (err) { alert("Não consegui apagar agora."); }
        });
      });
    }
    m.corpo.querySelector("#formCal").addEventListener("submit", async function (e) {
      e.preventDefault();
      var objeto = {
        titulo: m.corpo.querySelector("#fcTitulo").value.trim(),
        marca: m.corpo.querySelector("#fcMarca").value.trim(),
        tipo: m.corpo.querySelector("#fcTipo").value,
        data: m.corpo.querySelector("#fcData").value,
        status: m.corpo.querySelector("#fcFeito").checked ? "feito" : "a fazer"
      };
      try {
        if (editando) {
          await window.banco.from("calendario").update(objeto).eq("id", item.id);
        } else {
          await window.banco.from("calendario").insert(objeto);
        }
        m.fechar();
        await recarregar("calendario");
        desenharGradeCalendario(); desenharAtrasados();
      } catch (err) { alert("Não consegui salvar agora. Tente de novo."); }
    });
  }

  /* ============================================================
     8. ABA: CAMPANHAS
     ============================================================ */
  var campFiltro = "Todas";
  var campBusca = "";
  var campOrdemColuna = "criado_em";
  var campOrdemAsc = false;

  var CORES_TIPO_CAMPANHA = { "Conteúdo": "background:var(--rosa-claro);color:var(--magenta);", "Publicidade": "background:var(--azul-claro);color:var(--azul);" };

  function corStatusCampanha(status) {
    var idx = FUNIL_STATUS.indexOf(status);
    var cores = ["var(--cinza)", "var(--azul)", "var(--azul)", "var(--lavanda)", "var(--pessego)", "var(--rosa)", "var(--magenta)"];
    var fundos = ["var(--creme)", "var(--azul-claro)", "var(--azul-claro)", "var(--lavanda-claro)", "var(--pessego-claro)", "var(--rosa-claro)", "var(--rosa-claro)"];
    if (idx < 0) return "background:var(--creme);color:var(--texto-suave);";
    return "background:" + fundos[idx] + ";color:" + cores[idx] + ";";
  }

  function renderizarCampanhas() {
    var raiz = document.getElementById("abaCampanhas");

    var total = estado.campanhas.length;
    var ativas = estado.campanhas.filter(function (c) { return v(c, "ativa", true); }).length;
    var valorTotal = estado.campanhas.reduce(function (soma, c) { return soma + (Number(v(c, "valor", 0)) || 0); }, 0);
    var qtdTotal = estado.campanhas.reduce(function (soma, c) { return soma + (Number(v(c, "qtd", 0)) || 0); }, 0);
    var ticketMedio = qtdTotal > 0 ? valorTotal / qtdTotal : 0;
    var aReceber = estado.campanhas.filter(function (c) { return v(c, "pagamento", "pendente") === "pendente"; }).reduce(function (s, c) { return s + (Number(v(c, "valor", 0)) || 0); }, 0);
    var jaRecebido = estado.campanhas.filter(function (c) { return v(c, "pagamento", "pendente") === "pago"; }).reduce(function (s, c) { return s + (Number(v(c, "valor", 0)) || 0); }, 0);

    var html = '<div class="kpi-faixa" style="grid-template-columns:repeat(4,1fr);">';
    html += '<div class="kpi-item"><div class="kpi-valor">' + total + '</div><div class="kpi-label">Total de campanhas</div></div>';
    html += '<div class="kpi-item"><div class="kpi-valor">' + ativas + '</div><div class="kpi-label">Ativas</div></div>';
    html += '<div class="kpi-item"><div class="kpi-valor" style="font-size:1.15rem;">' + formatarMoeda(valorTotal) + '</div><div class="kpi-label">Valor total · ticket médio ' + formatarMoeda(ticketMedio) + '</div></div>';
    html += '<div class="kpi-item"><div class="kpi-valor" style="font-size:1.15rem;">' + formatarMoeda(aReceber) + '</div><div class="kpi-label">A receber · já recebido ' + formatarMoeda(jaRecebido) + '</div></div>';
    html += '</div>';

    html += '<div class="painel-card">';
    html += '<div class="barra-ferramentas">';
    html += '<div class="filtro-pilulas" id="filtroCamp">';
    ["Todas", "Ativas", "Finalizadas"].forEach(function (f) {
      html += '<button class="filtro-pilula' + (campFiltro === f ? " ativa" : "") + '" data-filtro="' + f + '">' + f + '</button>';
    });
    html += '</div>';
    html += '<div class="busca"><input type="text" id="buscaCamp" placeholder="Buscar campanha ou cliente" value="' + escapeHtml(campBusca) + '"></div>';
    html += '<button class="btn btn-outline" id="btnBaixarCamp">' + ICONE.baixar + ' Baixar CSV</button>';
    html += '<button class="btn btn-primary" id="btnNovaCampanha">' + ICONE.mais + ' Nova campanha</button>';
    html += '</div>';
    html += '<div id="tabelaCampanhas"></div>';
    html += '</div>';
    raiz.innerHTML = html;

    document.querySelectorAll('#filtroCamp .filtro-pilula').forEach(function (btn) {
      btn.addEventListener("click", function () {
        campFiltro = btn.getAttribute("data-filtro");
        document.querySelectorAll('#filtroCamp .filtro-pilula').forEach(function (b) { b.classList.remove("ativa"); });
        btn.classList.add("ativa");
        renderizarTabelaCampanhas();
      });
    });
    document.getElementById("buscaCamp").addEventListener("input", function (e) { campBusca = e.target.value; renderizarTabelaCampanhas(); });
    document.getElementById("btnNovaCampanha").addEventListener("click", function () { abrirFormularioCampanha(null); });
    document.getElementById("btnBaixarCamp").addEventListener("click", baixarCsvCampanhas);

    renderizarTabelaCampanhas();
  }

  function campanhasFiltradas() {
    var termo = campBusca.trim().toLowerCase();
    return estado.campanhas.filter(function (c) {
      if (campFiltro === "Ativas" && !v(c, "ativa", true)) return false;
      if (campFiltro === "Finalizadas" && v(c, "status", "") !== "Entregue") return false;
      if (!termo) return true;
      var alvo = (v(c, "campanha", "") + " " + v(c, "cliente", "")).toLowerCase();
      return alvo.indexOf(termo) !== -1;
    });
  }

  var COLUNAS_CAMP = [
    { chave: "favorita", rotulo: "" },
    { chave: "campanha", rotulo: "Campanha" },
    { chave: "cliente", rotulo: "Cliente" },
    { chave: "tipo", rotulo: "Tipo" },
    { chave: "status", rotulo: "Status" },
    { chave: "qtd", rotulo: "Qtd" },
    { chave: "valor", rotulo: "Valor" },
    { chave: "prazo", rotulo: "Prazo" },
    { chave: "pagamento", rotulo: "Pagamento" }
  ];

  function renderizarTabelaCampanhas() {
    var destino = document.getElementById("tabelaCampanhas");
    if (estado.campanhas.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Você ainda não tem campanhas cadastradas. Clique em "Nova campanha" para começar.</div>';
      return;
    }
    var lista = campanhasFiltradas();

    lista.sort(function (a, b) {
      var xa, xb;
      if (campOrdemColuna === "status") { xa = FUNIL_STATUS.indexOf(v(a, "status", "")); xb = FUNIL_STATUS.indexOf(v(b, "status", "")); }
      else if (campOrdemColuna === "favorita") { xa = v(a, "favorita", false) ? 1 : 0; xb = v(b, "favorita", false) ? 1 : 0; }
      else if (["qtd", "valor"].indexOf(campOrdemColuna) !== -1) { xa = Number(v(a, campOrdemColuna, 0)) || 0; xb = Number(v(b, campOrdemColuna, 0)) || 0; }
      else { xa = String(v(a, campOrdemColuna, "")).toLowerCase(); xb = String(v(b, campOrdemColuna, "")).toLowerCase(); }
      if (xa < xb) return campOrdemAsc ? -1 : 1;
      if (xa > xb) return campOrdemAsc ? 1 : -1;
      return 0;
    });

    if (lista.length === 0) {
      destino.innerHTML = '<div class="estado-vazio">Nenhuma campanha encontrada com esse filtro.</div>';
      return;
    }

    var html = '<div class="tabela-wrap"><table class="tabela"><thead><tr>';
    COLUNAS_CAMP.forEach(function (col) {
      var ativa = campOrdemColuna === col.chave;
      html += '<th class="ordenavel' + (ativa ? " ativa" : "") + '" data-coluna="' + col.chave + '">' + col.rotulo +
        '<span class="seta">' + (ativa ? (campOrdemAsc ? "▲" : "▼") : "▲") + '</span></th>';
    });
    html += '<th></th></tr></thead><tbody id="corpoTabelaCamp"></tbody></table></div>';
    destino.innerHTML = html;

    document.querySelectorAll('#tabelaCampanhas th.ordenavel').forEach(function (th) {
      th.addEventListener("click", function () {
        var col = th.getAttribute("data-coluna");
        if (campOrdemColuna === col) { campOrdemAsc = !campOrdemAsc; } else { campOrdemColuna = col; campOrdemAsc = true; }
        renderizarTabelaCampanhas();
      });
    });

    var corpo = document.getElementById("corpoTabelaCamp");
    var hoje = hojeISO();

    lista.forEach(function (c) {
      var tr = el("tr", v(c, "favorita", false) ? "linha-favorita" : "");
      var prazo = v(c, "prazo", "");
      var status = v(c, "status", "Briefing");
      var etiquetaPrazo = "";
      if (prazo && status !== "Entregue") {
        var diasAte = diasEntre(hoje, prazo);
        if (diasAte < 0) etiquetaPrazo = '<span class="etiqueta etiqueta-urgente">atrasado ' + Math.abs(diasAte) + 'd</span>';
        else if (diasAte <= 3) etiquetaPrazo = '<span class="etiqueta etiqueta-atencao">vence em ' + diasAte + 'd</span>';
      }
      tr.innerHTML =
        '<td><button class="estrela-btn ' + (v(c, "favorita", false) ? "ativa" : "") + '" data-acao="estrela" data-id="' + c.id + '">★</button></td>' +
        '<td class="celula-truncada" title="' + escapeHtml(v(c, "campanha", "")) + '">' + escapeHtml(v(c, "campanha", "-")) + '</td>' +
        '<td>' + escapeHtml(v(c, "cliente", "-")) + '</td>' +
        '<td><span class="pilula" style="' + (CORES_TIPO_CAMPANHA[v(c, "tipo", "")] || "background:var(--creme);color:var(--texto-suave);") + '">' + escapeHtml(v(c, "tipo", "-")) + '</span></td>' +
        '<td><span class="pilula" style="' + corStatusCampanha(status) + '">' + escapeHtml(status) + '</span></td>' +
        '<td>' + escapeHtml(v(c, "qtd", 0)) + '</td>' +
        '<td>' + formatarMoeda(v(c, "valor", 0)) + '</td>' +
        '<td>' + (prazo ? formatarDataBR(prazo) : "-") + " " + etiquetaPrazo + '</td>' +
        '<td><span class="pilula" style="' + (v(c, "pagamento", "") === "pago" ? "background:var(--rosa-claro);color:var(--magenta);" : "background:var(--creme);color:var(--texto-suave);") + '">' + escapeHtml(v(c, "pagamento", "pendente")) + '</span></td>' +
        '<td><button class="btn-icon" data-acao="apagar" data-id="' + c.id + '" title="Apagar">' + ICONE.lixeira + '</button></td>';
      tr.addEventListener("click", function (e) {
        if (e.target.closest('[data-acao]')) return;
        abrirFormularioCampanha(c);
      });
      corpo.appendChild(tr);
    });

    corpo.querySelectorAll('[data-acao="estrela"]').forEach(function (btn) {
      btn.addEventListener("click", async function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        var camp = estado.campanhas.find(function (x) { return String(x.id) === String(id); });
        if (!camp) return;
        var novo = !v(camp, "favorita", false);
        try {
          await window.banco.from("campanhas").update({ favorita: novo }).eq("id", id);
          camp.favorita = novo;
          renderizarTabelaCampanhas();
        } catch (err) { alert("Não consegui atualizar agora."); }
      });
    });
    corpo.querySelectorAll('[data-acao="apagar"]').forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = btn.getAttribute("data-id");
        confirmarExclusao("Apagar esta campanha?", async function () {
          try {
            await window.banco.from("campanhas").delete().eq("id", id);
            await recarregar("campanhas");
            renderizarCampanhas();
          } catch (err) { alert("Não consegui apagar agora."); }
        });
      });
    });
  }

  function baixarCsvCampanhas() {
    var lista = campanhasFiltradas();
    baixarArquivoCsv("campanhas.csv",
      ["Campanha", "Cliente", "Tipo", "Status", "Qtd", "Valor", "Prazo", "Pagamento"],
      lista.map(function (c) {
        return [v(c, "campanha", ""), v(c, "cliente", ""), v(c, "tipo", ""), v(c, "status", ""), v(c, "qtd", 0), formatarMoeda(v(c, "valor", 0)), formatarDataBR(v(c, "prazo", "")), v(c, "pagamento", "")];
      }));
  }

  function abrirFormularioCampanha(campanha) {
    var editando = !!campanha;
    var corpo = '<form id="formCamp">' +
      '<div class="campo"><label for="fcpNome">Campanha</label><input id="fcpNome" required value="' + escapeHtml(v(campanha, "campanha", "")) + '"></div>' +
      '<div class="campo"><label for="fcpCliente">Cliente</label><input id="fcpCliente" value="' + escapeHtml(v(campanha, "cliente", "")) + '"></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fcpTipo">Tipo</label><select id="fcpTipo">' +
      ["Conteúdo", "Publicidade"].map(function (t) { return '<option' + (v(campanha, "tipo", "Conteúdo") === t ? " selected" : "") + '>' + t + '</option>'; }).join("") +
      '</select></div>' +
      '<div class="campo"><label for="fcpStatus">Status</label><select id="fcpStatus">' +
      FUNIL_STATUS.map(function (s) { return '<option' + (v(campanha, "status", "Briefing") === s ? " selected" : "") + '>' + s + '</option>'; }).join("") +
      '</select></div></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fcpQtd">Quantidade de vídeos</label><input id="fcpQtd" type="number" min="0" value="' + v(campanha, "qtd", 1) + '"></div>' +
      '<div class="campo"><label for="fcpValor">Valor total (R$)</label><input id="fcpValor" type="number" min="0" step="0.01" value="' + v(campanha, "valor", 0) + '"></div></div>' +
      '<div class="linha-campos">' +
      '<div class="campo"><label for="fcpPrazo">Prazo de entrega</label><input id="fcpPrazo" type="date" value="' + (v(campanha, "prazo", "") || "") + '"></div>' +
      '<div class="campo"><label for="fcpPagamento">Pagamento</label><select id="fcpPagamento">' +
      ["pendente", "pago"].map(function (p) { return '<option' + (v(campanha, "pagamento", "pendente") === p ? " selected" : "") + '>' + p + '</option>'; }).join("") +
      '</select></div></div>' +
      '<div style="display:flex;gap:18px;margin-top:4px;">' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="checkbox" id="fcpAtiva" ' + (v(campanha, "ativa", true) ? "checked" : "") + ' style="accent-color:var(--magenta);width:16px;height:16px;"> Ativa</label>' +
      '<label style="display:flex;align-items:center;gap:8px;font-size:13px;"><input type="checkbox" id="fcpFavorita" ' + (v(campanha, "favorita", false) ? "checked" : "") + ' style="accent-color:var(--magenta);width:16px;height:16px;"> Favorita</label>' +
      '</div>' +
      '<div class="modal-acoes">' +
      (editando ? '<button type="button" class="btn btn-danger empurrar-esquerda" id="fcpApagar">Apagar</button>' : '') +
      '<button type="button" class="btn btn-outline" id="fcpCancelar">Cancelar</button>' +
      '<button type="submit" class="btn btn-primary">Salvar</button>' +
      '</div></form>';

    var m = abrirModal(editando ? "Editar campanha" : "Nova campanha", corpo);
    m.corpo.querySelector("#fcpCancelar").addEventListener("click", m.fechar);
    if (editando) {
      m.corpo.querySelector("#fcpApagar").addEventListener("click", function () {
        m.fechar();
        confirmarExclusao("Apagar esta campanha?", async function () {
          try {
            await window.banco.from("campanhas").delete().eq("id", campanha.id);
            await recarregar("campanhas");
            renderizarCampanhas();
          } catch (err) { alert("Não consegui apagar agora."); }
        });
      });
    }
    m.corpo.querySelector("#formCamp").addEventListener("submit", async function (e) {
      e.preventDefault();
      var objeto = {
        campanha: m.corpo.querySelector("#fcpNome").value.trim(),
        cliente: m.corpo.querySelector("#fcpCliente").value.trim(),
        tipo: m.corpo.querySelector("#fcpTipo").value,
        status: m.corpo.querySelector("#fcpStatus").value,
        qtd: Number(m.corpo.querySelector("#fcpQtd").value) || 0,
        valor: Number(m.corpo.querySelector("#fcpValor").value) || 0,
        prazo: m.corpo.querySelector("#fcpPrazo").value || null,
        pagamento: m.corpo.querySelector("#fcpPagamento").value,
        ativa: m.corpo.querySelector("#fcpAtiva").checked,
        favorita: m.corpo.querySelector("#fcpFavorita").checked
      };
      try {
        if (editando) {
          await window.banco.from("campanhas").update(objeto).eq("id", campanha.id);
        } else {
          await window.banco.from("campanhas").insert(objeto);
        }
        m.fechar();
        await recarregar("campanhas");
        renderizarCampanhas();
      } catch (err) { alert("Não consegui salvar agora. Tente de novo."); }
    });
  }

  /* ============================================================
     9. ABA: CHECKLIST (usa window.Biblioteca)
     ============================================================ */
  var checklistSubAba = "checklist";
  var revisaoMarcados = {};

  function renderizarChecklist() {
    var raiz = document.getElementById("abaChecklist");
    if (!window.Biblioteca) {
      raiz.innerHTML = '<div class="faixa faixa-aviso">Não encontrei o arquivo js/biblioteca.js. Confira se ele está na pasta certa.</div>';
      return;
    }
    var html = '<div class="subabas" id="subabasChecklist">';
    [["checklist", "Checklist do portfólio"], ["referencias", "Referências de vídeo"], ["tipos", "Roteiros"], ["nichos", "Ideias por nicho"], ["revisao", "Revisar meu roteiro"]].forEach(function (s) {
      html += '<button class="subaba-btn' + (checklistSubAba === s[0] ? " ativa" : "") + '" data-sub="' + s[0] + '">' + s[1] + '</button>';
    });
    html += '</div><div id="corpoChecklist"></div>';
    raiz.innerHTML = html;

    document.querySelectorAll('#subabasChecklist .subaba-btn').forEach(function (btn) {
      btn.addEventListener("click", function () {
        checklistSubAba = btn.getAttribute("data-sub");
        document.querySelectorAll('#subabasChecklist .subaba-btn').forEach(function (b) { b.classList.remove("ativa"); });
        btn.classList.add("ativa");
        desenharSubAbaChecklist();
      });
    });

    desenharSubAbaChecklist();
  }

  function desenharSubAbaChecklist() {
    var destino = document.getElementById("corpoChecklist");
    if (checklistSubAba === "checklist") desenharChecklistPrincipal(destino);
    else if (checklistSubAba === "referencias") desenharReferencias(destino);
    else if (checklistSubAba === "tipos") desenharTipos(destino);
    else if (checklistSubAba === "nichos") desenharNichos(destino);
    else if (checklistSubAba === "revisao") desenharRevisao(destino);
  }

  function chaveChecklist(secaoId, indice) { return "checklist__" + secaoId + "__" + indice; }

  function desenharChecklistPrincipal(destino) {
    var secoes = window.Biblioteca.CHECKLIST || [];
    var totalItens = 0, totalMarcados = 0;
    secoes.forEach(function (s) { totalItens += s.itens.length; s.itens.forEach(function (it, i) { if (estado.marcados[chaveChecklist(s.id, i)]) totalMarcados++; }); });
    var pctGeral = totalItens > 0 ? Math.round((totalMarcados / totalItens) * 100) : 0;

    var html = '<div class="progresso-geral"><div class="progresso-barra-fundo"><div class="progresso-barra" style="width:' + pctGeral + '%;"></div></div>' +
      '<div class="progresso-texto">' + totalMarcados + ' de ' + totalItens + ' prontos (' + pctGeral + '%)</div></div>';

    secoes.forEach(function (secao) {
      var marcadosSecao = 0;
      secao.itens.forEach(function (it, i) { if (estado.marcados[chaveChecklist(secao.id, i)]) marcadosSecao++; });
      var pctSecao = secao.itens.length ? Math.round((marcadosSecao / secao.itens.length) * 100) : 0;

      html += '<div class="checklist-secao" id="secao-' + secao.id + '">';
      html += '<button class="checklist-secao-topo" data-secao="' + secao.id + '">' +
        '<span class="emoji">' + secao.emoji + '</span>' +
        '<span class="info"><span class="nome">' + escapeHtml(secao.nome) + '</span><span class="resumo">' + escapeHtml(secao.resumo) + '</span></span>' +
        '<span class="mini-progresso"><span class="progresso-barra-fundo"><span class="progresso-barra" style="width:' + pctSecao + '%;"></span></span><span class="progresso-texto">' + pctSecao + '%</span></span>' +
        '</button>';
      html += '<div class="checklist-secao-corpo">';
      html += '<div class="checklist-secao-porque">' + escapeHtml(secao.porque) + '</div>';
      secao.itens.forEach(function (item, i) {
        var chave = chaveChecklist(secao.id, i);
        var marcado = !!estado.marcados[chave];
        html += '<label class="checklist-item' + (marcado ? " marcado" : "") + '">' +
          '<input type="checkbox" data-chave="' + chave + '" ' + (marcado ? "checked" : "") + '>' +
          '<span><span class="item-t">' + escapeHtml(item.t) + '</span><span class="item-d">' + escapeHtml(item.d) + '</span></span>' +
          '</label>';
      });
      html += '</div></div>';
    });

    destino.innerHTML = html;

    destino.querySelectorAll(".checklist-secao-topo").forEach(function (btn) {
      btn.addEventListener("click", function () {
        btn.closest(".checklist-secao").classList.toggle("aberta");
      });
    });
    destino.querySelectorAll('.checklist-item input[type="checkbox"]').forEach(function (chk) {
      chk.addEventListener("change", async function () {
        var chave = chk.getAttribute("data-chave");
        estado.marcados[chave] = chk.checked;
        try {
          await window.banco.from("marcados").upsert({ chave: chave, marcado: chk.checked }, { onConflict: "chave" });
        } catch (err) { /* mesmo se falhar salvar, mantém marcado na tela até recarregar */ }
        desenharChecklistPrincipal(destino);
        var reaberta = document.getElementById("secao-" + chave.split("__")[1]);
        if (reaberta) reaberta.classList.add("aberta");
      });
    });
  }

  function desenharReferencias(destino) {
    var refs = window.Biblioteca.REFERENCIAS || [];
    var html = '<div class="grade-cartoes">';
    refs.forEach(function (r, i) {
      html += '<button class="cartao-referencia" data-ref="' + i + '" style="cursor:pointer;">' +
        '<div class="capa-vertical">' + r.emoji + '</div>' +
        '<div class="info"><div class="titulo">' + escapeHtml(r.titulo) + '</div>' +
        '<div class="meta"><span>' + escapeHtml(r.estilo) + '</span><span>' + escapeHtml(r.duracao) + '</span><span>' + escapeHtml(r.marca) + '</span></div></div>' +
        '</button>';
    });
    html += '</div>';
    destino.innerHTML = html;

    destino.querySelectorAll('[data-ref]').forEach(function (btn) {
      btn.addEventListener("click", function () { abrirFichaReferencia(refs[Number(btn.getAttribute("data-ref"))]); });
    });
  }

  function abrirFichaReferencia(r) {
    var corpo = '<div class="ficha-referencia">' +
      '<div class="ficha-secao"><div class="ficha-label">Gancho</div><div class="ficha-texto">' + r.gancho + '</div></div>' +
      '<div class="ficha-secao"><div class="ficha-label">Por que funciona</div><div class="ficha-texto">' + escapeHtml(r.porque) + '</div></div>' +
      '<div class="ficha-secao"><div class="ficha-label">Diferencial</div><div class="ficha-texto">' + escapeHtml(r.diferencial) + '</div></div>' +
      '<div class="ficha-secao"><div class="ficha-label">Erro comum</div><div class="ficha-texto">' + escapeHtml(r.erro) + '</div></div>' +
      '<div class="ficha-secao"><div class="ficha-label">Roteiro</div>';
    (r.roteiro || []).forEach(function (bloco) {
      corpo += '<div class="bloco-roteiro"><div class="tempo">' + escapeHtml(bloco.t) + '</div><div class="texto">' + bloco.o + '</div></div>';
    });
    corpo += '</div>';
    if (r.youtube) corpo += '<a class="btn btn-primary" href="' + r.youtube + '" target="_blank" rel="noopener">Assistir vídeo</a>';
    corpo += '</div>';
    abrirModal(r.emoji + " " + escapeHtml(r.titulo), corpo, { grande: true });
  }

  function desenharTipos(destino) {
    var tipos = window.Biblioteca.TIPOS || [];
    var html = '<div class="grade-tipos">';
    tipos.forEach(function (t, i) {
      html += '<div class="cartao-tipo" id="tipo-' + i + '">' +
        '<button class="cartao-tipo-topo" data-tipo="' + i + '">' +
        '<span class="emoji">' + t.emoji + '</span><span class="nome" style="flex:1;">' + escapeHtml(t.nome) + '</span><span class="duracao">' + escapeHtml(t.duracao) + '</span></button>' +
        '<div class="cartao-tipo-corpo">';
      html += '<div class="checklist-secao-porque">' + escapeHtml(t.porque) + '</div>';
      (t.beats || []).forEach(function (b) { html += '<div class="bloco-roteiro"><div class="tempo">' + escapeHtml(b.t) + '</div><div class="texto">' + b.o + '</div></div>'; });
      if (t.erros && t.erros.length) {
        html += '<div class="ficha-label" style="margin-top:10px;">Erros comuns</div><ul style="font-size:12.5px;color:var(--texto-suave);padding-left:18px;margin:6px 0 0;">';
        t.erros.forEach(function (er) { html += '<li>' + escapeHtml(er) + '</li>'; });
        html += '</ul>';
      }
      html += '</div></div>';
    });
    html += '</div>';
    destino.innerHTML = html;

    destino.querySelectorAll(".cartao-tipo-topo").forEach(function (btn) {
      btn.addEventListener("click", function () { btn.closest(".cartao-tipo").classList.toggle("aberto"); });
    });
  }

  function desenharNichos(destino) {
    var nichos = window.Biblioteca.NICHOS || [];
    var html = '<div class="grade-nichos">';
    nichos.forEach(function (n, i) {
      html += '<div class="cartao-nicho">' +
        '<button class="cartao-nicho-topo" data-nicho="' + i + '">' +
        '<span class="emoji">' + n.emoji + '</span><span class="nome">' + escapeHtml(n.nome) + '</span></button>' +
        '<div class="cartao-nicho-corpo">';
      (n.ideias || []).forEach(function (idea) {
        html += '<div class="ideia-linha"><div class="ideia-t">' + escapeHtml(idea.t) + '</div><div class="ideia-gancho">' + escapeHtml(idea.gancho) + '</div></div>';
      });
      html += '</div></div>';
    });
    html += '</div>';
    destino.innerHTML = html;

    destino.querySelectorAll(".cartao-nicho-topo").forEach(function (btn) {
      btn.addEventListener("click", function () { btn.closest(".cartao-nicho").classList.toggle("aberto"); });
    });
  }

  function desenharRevisao(destino) {
    var blocos = window.Biblioteca.REVISAO || [];
    var html = '<div class="painel-card">' +
      '<div class="campo"><label for="areaRoteiro">Cole aqui o seu roteiro</label>' +
      '<textarea id="areaRoteiro" rows="7" placeholder="Cole o texto do seu roteiro aqui, só para ter à vista enquanto confere os itens abaixo."></textarea></div>' +
      '</div>';

    blocos.forEach(function (bloco, bi) {
      html += '<div class="revisao-bloco"><div class="revisao-bloco-titulo"><span>' + bloco.emoji + '</span> ' + escapeHtml(bloco.bloco) + '</div>';
      bloco.itens.forEach(function (item, ii) {
        var chave = "rev__" + bi + "__" + ii;
        var marcado = !!revisaoMarcados[chave];
        html += '<label class="checklist-item' + (marcado ? " marcado" : "") + '">' +
          '<input type="checkbox" data-chave-rev="' + chave + '" ' + (marcado ? "checked" : "") + '>' +
          '<span><span class="item-t">' + escapeHtml(item.t) + '</span><span class="item-d">' + escapeHtml(item.d) + '</span></span></label>';
      });
      html += '</div>';
    });

    destino.innerHTML = html;

    try {
      var salvo = localStorage.getItem("evelyn_roteiro_rascunho");
      if (salvo) document.getElementById("areaRoteiro").value = salvo;
    } catch (e) {}
    document.getElementById("areaRoteiro").addEventListener("input", function (e) {
      try { localStorage.setItem("evelyn_roteiro_rascunho", e.target.value); } catch (err) {}
    });

    destino.querySelectorAll('[data-chave-rev]').forEach(function (chk) {
      chk.addEventListener("change", function () {
        revisaoMarcados[chk.getAttribute("data-chave-rev")] = chk.checked;
        chk.closest(".checklist-item").classList.toggle("marcado", chk.checked);
      });
    });
  }

  /* ============================================================
     INÍCIO
     ============================================================ */
  iniciar();
})();

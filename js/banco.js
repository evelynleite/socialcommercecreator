/*
  Conexão única com o Supabase.
  Este arquivo é carregado por TODAS as páginas que precisam do banco:
  o portfólio (index.html), a tela de login e o painel admin.

  Se um dia você precisar trocar o projeto do Supabase, mexe só
  nas duas linhas abaixo, nunca mais em lugar nenhum.

  Importante: a chave aqui embaixo é a chave PÚBLICA (publishable/anon).
  Ela é feita pra ficar exposta no site, o banco de dados que barra o
  que ela pode ou não fazer (isso é o RLS, configurado no banco.sql).
  Nunca coloque aqui a chave secreta (service_role).
*/

const SUPABASE_URL = "https://gglzafyqyhxgycnxowpv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Huo9RsAIPvqbuSysvXRL6g_osJM1pM1";

// Cria o cliente do Supabase usando a biblioteca carregada por CDN
// (a tag <script> do supabase-js precisa vir ANTES desta, em cada página).
window.banco = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

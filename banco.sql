-- ============================================================
-- BANCO DE DADOS DO PAINEL ADMIN — Evelyn Leite
-- ============================================================
-- COMO USAR ESTE ARQUIVO:
-- 1. Entre em supabase.com e abra o seu projeto.
-- 2. No menu da esquerda, clique em "SQL Editor".
-- 3. Clique em "New query" (nova consulta).
-- 4. Cole este arquivo INTEIRO ali dentro.
-- 5. Clique no botão verde "Run" (ou aperte Cmd+Enter).
-- Se aparecer "Success" no final, deu tudo certo.
-- Você pode rodar este arquivo mais de uma vez sem medo, ele
-- nunca duplica nada (tudo usa "se não existir ainda").
-- ============================================================

-- Liga o recurso que gera um código único (uuid) para cada linha nova
create extension if not exists "pgcrypto";


-- ============================================================
-- PARTE 1: AS TABELAS
-- ============================================================

-- ------------------------------------------------------------
-- videos: os vídeos que aparecem no seu portfólio público
-- ------------------------------------------------------------
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  link text,
  capa text,
  nicho text,
  formato text default '4:5',
  marca text,
  destaque text,
  ordem integer default 0,
  visivel boolean default true,
  criado_em timestamptz default now()
);

comment on table public.videos is 'Vídeos do portfólio público. O site lê esta tabela direto, sem precisar publicar de novo.';
comment on column public.videos.capa is 'Endereço da imagem de capa do vídeo (um link, ou um caminho como fotos/algumacoisa.jpg). Se ficar vazio, o site mostra um fundo colorido no lugar.';
comment on column public.videos.formato is 'Use exatamente 9:16 para o vídeo aparecer na seção "Conteúdos de destaque". Qualquer outro valor (o padrão é 4:5) faz ele aparecer na galeria "Trabalhos por nicho".';
comment on column public.videos.destaque is 'O número forte mostrado no card, exatamente como você quer que apareça. Exemplo: +2,4M views';
comment on column public.videos.ordem is 'Número que define a ordem de exibição. Quanto menor, mais cedo aparece. Arrastar os vídeos no admin atualiza este número sozinho.';

-- ------------------------------------------------------------
-- marcas: sua base de contatos de empresa (o seu CRM)
-- ------------------------------------------------------------
create table if not exists public.marcas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  instagram text,
  email text,
  telefone text,
  situacao text default 'Lead',
  obs text,
  ultimo_contato date,
  criado_em timestamptz default now()
);

comment on table public.marcas is 'Contatos de marca. Recebe entradas automáticas do formulário do seu portfólio, sempre como Lead.';
comment on column public.marcas.situacao is 'Um destes quatro textos, exatamente assim: Lead, Conversando, Cliente, Parada';

-- ------------------------------------------------------------
-- calendario: sua agenda de gravar, editar e postar
-- ------------------------------------------------------------
create table if not exists public.calendario (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  marca text,
  tipo text default 'gravar',
  data date not null,
  status text default 'a fazer',
  criado_em timestamptz default now()
);

comment on column public.calendario.tipo is 'Um destes três textos: gravar, editar, postar';
comment on column public.calendario.status is 'Um destes dois textos: a fazer, feito';

-- ------------------------------------------------------------
-- campanhas: as campanhas fechadas com marcas
-- ------------------------------------------------------------
create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),
  campanha text not null,
  cliente text,
  tipo text default 'Conteúdo',
  status text default 'Briefing',
  qtd integer default 1,
  valor numeric(12,2) default 0,
  prazo date,
  pagamento text default 'pendente',
  ativa boolean default true,
  favorita boolean default false,
  criado_em timestamptz default now()
);

comment on column public.campanhas.tipo is 'Um destes dois textos: Conteúdo, Publicidade';
comment on column public.campanhas.status is 'Um destes sete textos, nesta ordem de funil: Briefing, Roteiro, Aprovação Roteiro, Gravação, Edição, Aprovado, Entregue';
comment on column public.campanhas.pagamento is 'Um destes dois textos: pendente, pago';
comment on column public.campanhas.prazo is 'Data de entrega. Aparece sozinha no calendário, sem precisar digitar de novo.';

-- ------------------------------------------------------------
-- marcados: o que você já marcou no checklist do portfólio
-- ------------------------------------------------------------
create table if not exists public.marcados (
  chave text primary key,
  marcado boolean default true,
  atualizado_em timestamptz default now()
);

comment on table public.marcados is 'Guarda quais itens do checklist você já marcou. A chave é um texto livre que identifica o item, ex: capa__foto-profissional';

-- ------------------------------------------------------------
-- visitas: registro simples de quem visita o portfólio
-- ------------------------------------------------------------
create table if not exists public.visitas (
  id uuid primary key default gen_random_uuid(),
  data timestamptz default now(),
  pagina text,
  origem text
);

comment on table public.visitas is 'Uma linha por visita ao portfólio. Preenchida sozinha pelo próprio site, sem pedir nada ao visitante.';
comment on column public.visitas.origem is 'De onde a pessoa veio, ex: instagram.com, google, ou direto (quando não dá pra saber)';


-- ============================================================
-- PARTE 2: A TRANCA (RLS = Row Level Security)
-- ============================================================
-- Sem isso, qualquer pessoa que descobrisse a chave pública do
-- seu projeto conseguiria ler ou apagar todos os seus dados.
-- Com RLS ligado, o banco nega TUDO por padrão. Só o que a gente
-- escrever abaixo, explicitamente, fica liberado.
-- ============================================================

alter table public.videos     enable row level security;
alter table public.marcas     enable row level security;
alter table public.calendario enable row level security;
alter table public.campanhas  enable row level security;
alter table public.marcados   enable row level security;
alter table public.visitas    enable row level security;

-- --------------------------------------------------------
-- videos
-- Exceção necessária: qualquer visitante do site precisa
-- conseguir LER os vídeos, senão o portfólio fica em branco.
-- Só você (logada) pode inserir, editar ou apagar.
-- --------------------------------------------------------
create policy "videos_leitura_publica"
  on public.videos for select
  using (true);

create policy "videos_escrita_so_a_dona"
  on public.videos for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- --------------------------------------------------------
-- marcas
-- Exceção pedida por você: qualquer pessoa pode INSERIR
-- (é o formulário de contato do site). Ler, editar e apagar
-- continua só você.
-- --------------------------------------------------------
create policy "marcas_insercao_publica"
  on public.marcas for insert
  with check (true);

create policy "marcas_leitura_so_a_dona"
  on public.marcas for select
  using (auth.uid() is not null);

create policy "marcas_atualizacao_so_a_dona"
  on public.marcas for update
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

create policy "marcas_exclusao_so_a_dona"
  on public.marcas for delete
  using (auth.uid() is not null);

-- --------------------------------------------------------
-- calendario: 100% privado, nenhuma exceção
-- --------------------------------------------------------
create policy "calendario_so_a_dona"
  on public.calendario for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- --------------------------------------------------------
-- campanhas: 100% privado, nenhuma exceção
-- --------------------------------------------------------
create policy "campanhas_so_a_dona"
  on public.campanhas for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- --------------------------------------------------------
-- marcados: 100% privado, nenhuma exceção
-- --------------------------------------------------------
create policy "marcados_so_a_dona"
  on public.marcados for all
  using (auth.uid() is not null)
  with check (auth.uid() is not null);

-- --------------------------------------------------------
-- visitas
-- Exceção pedida por você: qualquer pessoa pode INSERIR
-- (é o registro automático do site). Ler continua só você.
-- --------------------------------------------------------
create policy "visitas_insercao_publica"
  on public.visitas for insert
  with check (true);

create policy "visitas_leitura_so_a_dona"
  on public.visitas for select
  using (auth.uid() is not null);


-- ============================================================
-- PARTE 3: UMA LINHA DE EXEMPLO EM CADA LISTA
-- ============================================================
-- Só pra você ver o formato de cada tabela. Nada de marca famosa,
-- nada de número inventado. É só um modelo, marcado bem claro
-- como exemplo, pra você apagar direto no painel quando quiser
-- (Portfólio, Marcas e Calendário e Campanhas já tem o botão de
-- apagar em cada linha).
-- ============================================================

insert into public.videos (titulo, link, nicho, formato, marca, destaque, ordem, visivel)
values (
  '[EXEMPLO] apague depois de ver o formato',
  'https://instagram.com',
  'beleza',
  '4:5',
  'Marca Exemplo',
  '+000K views',
  999,
  false
);

insert into public.marcas (nome, instagram, email, telefone, situacao, obs)
values (
  '[EXEMPLO] apague depois de ver o formato',
  '@marcaexemplo',
  'exemplo@marca.com',
  '(00) 00000-0000',
  'Lead',
  'Isso aqui é só um exemplo do formato da linha.'
);

insert into public.calendario (titulo, marca, tipo, data, status)
values (
  '[EXEMPLO] apague depois de ver o formato',
  'Marca Exemplo',
  'gravar',
  current_date,
  'a fazer'
);

insert into public.campanhas (campanha, cliente, tipo, status, qtd, valor, prazo, pagamento, ativa, favorita)
values (
  '[EXEMPLO] apague depois de ver o formato',
  'Marca Exemplo',
  'Conteúdo',
  'Briefing',
  1,
  0,
  current_date + 7,
  'pendente',
  true,
  false
);

-- A tabela "visitas" não recebe exemplo nenhum: ela começa em
-- zero de verdade, porque você ainda não teve visita nenhuma.

-- ============================================================
-- FIM. Se apareceu "Success" (ou "Sucesso"), está tudo pronto.
-- ============================================================

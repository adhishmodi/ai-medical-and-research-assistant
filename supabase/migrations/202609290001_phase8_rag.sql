create extension if not exists vector with schema extensions;

create table if not exists public.medical_documents (
  id bigint generated always as identity primary key,
  source_url text not null unique,
  source_type text not null check (source_type in ('pubmed', 'guidance')),
  organization text not null,
  title text not null,
  description text not null default '',
  publication_year text,
  study_type text,
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.medical_chunks (
  id bigint generated always as identity primary key,
  document_id bigint not null references public.medical_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists medical_chunks_embedding_hnsw
  on public.medical_chunks using hnsw (embedding vector_cosine_ops);

create index if not exists medical_documents_source_type_idx
  on public.medical_documents(source_type);

create or replace function public.match_medical_chunks(
  query_embedding extensions.vector(768),
  match_threshold float default 0.55,
  match_count int default 8
)
returns table (
  id bigint,
  document_id bigint,
  content text,
  similarity float,
  source_url text,
  source_type text,
  organization text,
  title text,
  publication_year text,
  study_type text
)
language sql stable
as $$
  select
    c.id,
    c.document_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity,
    d.source_url,
    d.source_type,
    d.organization,
    d.title,
    d.publication_year,
    d.study_type
  from public.medical_chunks c
  join public.medical_documents d on d.id = c.document_id
  where 1 - (c.embedding <=> query_embedding) >= match_threshold
  order by c.embedding <=> query_embedding
  limit least(match_count, 20);
$$;

alter table public.medical_documents enable row level security;
alter table public.medical_chunks enable row level security;

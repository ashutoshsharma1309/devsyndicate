-- Dev Syndicate lead storage. Apply with `npm run db:setup` (idempotent).

create extension if not exists pgcrypto;

create table if not exists leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  status        text not null default 'new'
                check (status in ('new','contacted','meeting','proposal','negotiation','won','lost')),

  institution   text not null,
  city          text not null,
  state         text not null,
  website       text not null default '',

  name          text not null,
  designation   text not null,
  email         text not null,
  phone         text not null,

  event_type    text not null,
  participants  text not null,
  format        text not null,
  timeline      text not null,
  theme         text not null default '',
  message       text not null default '',

  source        text,
  ip_hash       text
);

create index if not exists leads_created_at_idx on leads (created_at desc);
create index if not exists leads_status_idx on leads (status);
create index if not exists leads_ip_hash_idx on leads (ip_hash, created_at);

create table if not exists lead_notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);

create index if not exists lead_notes_lead_id_idx on lead_notes (lead_id, created_at);

-- Added later; safe to re-run on existing databases. null = not recorded
-- (still sending, no mailer configured, or stored before this was tracked).
alter table leads add column if not exists notify_status text
  check (notify_status in ('sent','failed'));

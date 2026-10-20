-- Dev Syndicate lead storage and admin accounts. Apply with `npm run db:setup` (idempotent;
-- only "create … if not exists" / "add column if not exists", so re-running never drops data).

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

-- Who the enquiry is from: college, company or other. '' = stored before the form asked.
alter table leads add column if not exists org_type text not null default '';
create index if not exists leads_org_type_idx on leads (org_type);

-- Named admin accounts. Until one exists, the shared ADMIN_PASSWORD_HASH signs in.
create table if not exists admins (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,   -- stored lowercase
  name           text not null,
  password_hash  text not null,          -- scrypt:<salt hex>:<key hex>
  disabled       boolean not null default false,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

-- Audit trail. lead_id has no foreign key on purpose: history outlives deleted leads,
-- and lead_label keeps the institution name readable afterwards. No personal data in detail.
create table if not exists admin_activity (
  id          uuid primary key default gen_random_uuid(),
  at          timestamptz not null default now(),
  actor       text not null,
  action      text not null,
  lead_id     uuid,
  lead_label  text,
  detail      text
);

create index if not exists admin_activity_at_idx on admin_activity (at desc);
create index if not exists admin_activity_lead_idx on admin_activity (lead_id, at desc);

-- Failed sign-ins per hashed IP, for lockout across server instances. Pruned after a day.
create table if not exists login_failures (
  key  text not null,
  at   timestamptz not null default now()
);

create index if not exists login_failures_key_idx on login_failures (key, at);

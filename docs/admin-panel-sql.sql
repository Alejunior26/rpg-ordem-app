-- A.S.A. Admin panel helpers and policies
-- Rode no SQL Editor do Supabase depois do supabase-schema.sql.
--
-- Roles oficiais:
-- - player: jogador comum
-- - dm: mestre, pode ver painel e personagens
-- - admin: administrador, pode trocar roles

update public.profiles
set role = case
  when role = 'adm' then 'admin'
  when role = 'jogador' then 'player'
  when role is null then 'player'
  else role
end
where role in ('adm', 'jogador') or role is null;

alter table public.profiles
  alter column role set default 'player';

alter table public.profiles
  drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('player', 'dm', 'admin'));

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_dm_or_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role in ('dm', 'admin')
  );
$$;

create or replace function public.update_my_profile_name(next_name text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  update public.profiles
  set nome_personagem = nullif(btrim(next_name), '')
  where id = auth.uid()
  returning * into updated_profile;

  return updated_profile;
end;
$$;

create or replace function public.admin_update_profile_role(
  target_profile_id uuid,
  next_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
  admin_count integer;
begin
  if not public.is_admin() then
    raise exception 'admin role required';
  end if;

  if next_role not in ('player', 'dm', 'admin') then
    raise exception 'invalid role: %', next_role;
  end if;

  if target_profile_id = auth.uid() and next_role <> 'admin' then
    select count(*) into admin_count
    from public.profiles
    where role = 'admin';

    if admin_count <= 1 then
      raise exception 'cannot remove the last admin';
    end if;
  end if;

  update public.profiles
  set role = next_role
  where id = target_profile_id
  returning * into updated_profile;

  return updated_profile;
end;
$$;

grant execute on function public.update_my_profile_name(text) to authenticated;
grant execute on function public.admin_update_profile_role(uuid, text) to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_dm_or_admin() to authenticated;

-- Perfis: usuarios leem a propria linha; mestre/admin leem todos.
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
for select using (public.is_dm_or_admin() or id = auth.uid());

-- Nunca permita que player altere profiles diretamente pelo client.
-- Nome de personagem usa update_my_profile_name(); role usa admin_update_profile_role().
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
for update using (public.is_admin())
with check (public.is_admin());

-- Mestres/admins podem ver personagens dos jogadores.
drop policy if exists "characters admin read" on public.characters;
create policy "characters admin read" on public.characters
for select using (owner_id = auth.uid() or public.is_dm_or_admin());

-- Apenas admins podem editar personagens de terceiros.
drop policy if exists "characters admin update" on public.characters;
create policy "characters admin update" on public.characters
for update using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

-- Apenas admins podem excluir personagens de terceiros.
drop policy if exists "characters admin delete" on public.characters;
create policy "characters admin delete" on public.characters
for delete using (owner_id = auth.uid() or public.is_admin());

-- Garante que o seu usuario seja admin. Troque pelo seu e-mail.
-- update public.profiles set role = 'admin' where email = 'SEU_EMAIL_AQUI';

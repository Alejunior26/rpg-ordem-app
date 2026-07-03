-- A.S.A. Admin panel helpers and policies
-- Rode no SQL Editor do Supabase depois do supabase-schema.sql.

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
      and role = 'adm'
  );
$$;

-- Permite que admins vejam todos os perfis para gerenciar roles.
drop policy if exists "profiles admin read" on public.profiles;
create policy "profiles admin read" on public.profiles
for select using (public.is_admin() or id = auth.uid());

-- Permite que admins atualizem roles/perfis.
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles admin update" on public.profiles
for update using (public.is_admin() or id = auth.uid())
with check (public.is_admin() or id = auth.uid());

-- Permite que admins vejam todos os personagens.
drop policy if exists "characters admin read" on public.characters;
create policy "characters admin read" on public.characters
for select using (owner_id = auth.uid() or public.is_admin());

-- Permite que admins editem qualquer personagem, caso precise ajustar ficha de player.
drop policy if exists "characters admin update" on public.characters;
create policy "characters admin update" on public.characters
for update using (owner_id = auth.uid() or public.is_admin())
with check (owner_id = auth.uid() or public.is_admin());

-- Opcional: admins podem excluir personagens se necessário.
drop policy if exists "characters admin delete" on public.characters;
create policy "characters admin delete" on public.characters
for delete using (owner_id = auth.uid() or public.is_admin());

-- Garante que o seu usuario seja mestre. Troque pelo seu e-mail.
-- update public.profiles set role = 'adm' where email = 'SEU_EMAIL_AQUI';

-- =====================================================================
-- Étape 2 : espace gérant et administration
-- À coller dans Supabase > SQL Editor, puis Run
-- =====================================================================

-- Savoir si l'utilisateur connecté est administrateur
create or replace function is_admin()
returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;
revoke all on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

-- L'administrateur peut lire les zones, offres et profils
create policy "zones: lecture admin"  on zones    for select using (is_admin());
create policy "offres: lecture admin" on offers   for select using (is_admin());
create policy "profil: lecture admin" on profiles for select using (is_admin());

-- Valider, suspendre ou remettre en attente une zone (réservé aux admins)
create or replace function admin_set_zone_status(p_zone_id uuid, p_status zone_status)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then
    raise exception 'forbidden';
  end if;
  update zones set status = p_status where id = p_zone_id;
end $$;
revoke all on function admin_set_zone_status(uuid, zone_status) from public, anon;
grant execute on function admin_set_zone_status(uuid, zone_status) to authenticated;

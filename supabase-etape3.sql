-- =====================================================================
-- Étape 3 : import des tickets et stock
-- À coller dans Supabase > SQL Editor, puis Run
-- =====================================================================

-- Importer des tickets (déjà chiffrés par le serveur) dans une offre.
-- Réservé au gérant propriétaire de la zone. Les doublons sont ignorés.
create or replace function import_tickets(p_offer_id uuid, p_codes jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_total    integer;
  v_inserted integer;
begin
  if not exists (
    select 1 from offers o join zones z on z.id = o.zone_id
    where o.id = p_offer_id and z.manager_id = auth.uid()
  ) then
    raise exception 'forbidden';
  end if;

  v_total := jsonb_array_length(p_codes);
  if v_total = 0 or v_total > 5000 then
    raise exception 'invalid_batch_size';
  end if;

  with ins as (
    insert into tickets (offer_id, code_encrypted, code_hash)
    select p_offer_id, e->>'c', e->>'h'
    from jsonb_array_elements(p_codes) as e
    on conflict (offer_id, code_hash) do nothing
    returning 1
  )
  select count(*) into v_inserted from ins;

  return jsonb_build_object(
    'total', v_total,
    'inserted', v_inserted,
    'duplicates', v_total - v_inserted
  );
end $$;
revoke all on function import_tickets(uuid, jsonb) from public, anon;
grant execute on function import_tickets(uuid, jsonb) to authenticated;

-- Stock par offre pour une zone (sans jamais exposer les codes)
create or replace function zone_stock(p_zone_id uuid)
returns table (o_offer_id uuid, n_available bigint, n_reserved bigint, n_sold bigint)
language plpgsql security definer stable set search_path = public as $$
begin
  if not exists (
    select 1 from zones z where z.id = p_zone_id and z.manager_id = auth.uid()
  ) then
    raise exception 'forbidden';
  end if;

  return query
    select o.id,
           count(t.id) filter (where t.status = 'available'),
           count(t.id) filter (where t.status = 'reserved'),
           count(t.id) filter (where t.status = 'sold')
    from offers o
    left join tickets t on t.offer_id = o.id
    where o.zone_id = p_zone_id
    group by o.id;
end $$;
revoke all on function zone_stock(uuid) from public, anon;
grant execute on function zone_stock(uuid) to authenticated;

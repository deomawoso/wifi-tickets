-- =====================================================================
-- Étape 4 : partie client (achat de tickets)
-- À coller dans Supabase > SQL Editor, puis Run
-- =====================================================================

-- Disponibilité des offres d'une zone ACTIVE, pour le public.
-- Ne renvoie que des nombres : jamais les codes.
create or replace function public_stock(p_zone_id uuid)
returns table (o_offer_id uuid, n_available bigint)
language sql security definer stable set search_path = public as $$
  select o.id,
         count(t.id) filter (where t.status = 'available')
  from offers o
  join zones z on z.id = o.zone_id and z.status = 'active'
  left join tickets t on t.offer_id = o.id
  where o.zone_id = p_zone_id and o.active
  group by o.id;
$$;
revoke all on function public_stock(uuid) from public;
grant execute on function public_stock(uuid) to anon, authenticated;

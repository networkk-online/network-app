ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check CHECK (type = ANY (ARRAY[
  'like','comment','follow','reply','transaction','tip','donation','system','broadcast','admin',
  'deposit_request','deposit','deposit_pending','deposit_approved','withdrawal','withdrawal_request',
  'topup','earning','cinema_new','affiliation_invite','affiliation_response','payment'
]));
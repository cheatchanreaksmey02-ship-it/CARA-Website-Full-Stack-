

alter table public.orders add column if not exists customer_name text;
alter table public.orders add column if not exists phone text;
alter table public.orders add column if not exists email text;
alter table public.orders add column if not exists address text;
alter table public.orders add column if not exists province text;
alter table public.orders add column if not exists payment_method text default 'cod';
alter table public.orders add column if not exists shipping_fee numeric(10,2) default 0;
alter table public.orders add column if not exists note text;



-- 1. PROFILES (extends auth.users with role + name)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

-- auto-create a profile row whenever someone registers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data->>'full_name', 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CATEGORIES
create table if not exists public.categories (
  id bigint generated always as identity primary key,
  name text not null unique
);
insert into public.categories (name) values ('Feature'),('Casual'),('New')
  on conflict (name) do nothing;

-- 3. PRODUCTS
create table if not exists public.products (
  id bigint generated always as identity primary key,
  name text not null,
  brand text,
  price numeric(10,2) not null default 0,
  rating numeric(2,1) default 5,
  image_url text,
  category_id bigint references public.categories(id),
  description text,
  stock integer not null default 0,
  created_at timestamptz default now()
);

-- 4. ORDERS
create table if not exists public.orders (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','paid','shipped','completed','cancelled')),
  total numeric(10,2) not null default 0,
  created_at timestamptz default now()
);

-- 5. ORDER ITEMS
create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id bigint references public.orders(id) on delete cascade,
  product_id bigint references public.products(id),
  quantity integer not null default 1,
  price numeric(10,2) not null
);

-- 6. CONTACT MESSAGES
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  subject text,
  message text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.categories enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.messages enable row level security;

-- helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable;

-- PROFILES: users see/edit their own row, admins see all
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_admin_update_any" on public.profiles
  for update using (public.is_admin());

-- CATEGORIES: everyone can read, only admins write
create policy "categories_read_all" on public.categories for select using (true);
create policy "categories_admin_write" on public.categories for all using (public.is_admin());

-- PRODUCTS: everyone can read, only admins write
create policy "products_read_all" on public.products for select using (true);
create policy "products_admin_insert" on public.products for insert with check (public.is_admin());
create policy "products_admin_update" on public.products for update using (public.is_admin());
create policy "products_admin_delete" on public.products for delete using (public.is_admin());

-- ORDERS: user sees own orders, admin sees all
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_admin_update" on public.orders
  for update using (public.is_admin());

-- ORDER ITEMS: visible if you can see the parent order
create policy "order_items_select" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "order_items_insert" on public.order_items
  for insert with check (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

-- MESSAGES: anyone (incl. anonymous) can insert, only admin can read
create policy "messages_insert_anyone" on public.messages for insert with check (true);
create policy "messages_admin_select" on public.messages for select using (public.is_admin());

-- ============================================================
-- SEED PRODUCTS (matches the static items already on the site)
-- ============================================================
insert into public.products (name, brand, price, rating, image_url, category_id, stock)
select * from (values
  ('Pinstripe Bow Peplum Top','Cara',12.5,5,'img/product/f1.jpg',1,25),
  ('Vintage Gingham Corset Top','Zara',9.99,4.5,'img/product/f2.jpg',1,25),
  ('Floral Lace Top','Pull&Bear',13.0,5,'img/product/f3.jpg',1,25),
  ('Rose Mini Dress','Cara Luxe',75.0,5,'img/product/c1.jpg',2,15)
) as v(name, brand, price, rating, image_url, category_id, stock)
where not exists (select 1 from public.products);



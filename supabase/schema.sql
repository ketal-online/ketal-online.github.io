-- Create a table for rooms
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  password text, -- Nullable. If null, room is public.
  name text
);

-- Set up Row Level Security (RLS)
alter table public.rooms enable row level security;

-- Allow anyone to read room metadata (needed to check if room exists)
-- In a real app, you might want to hide password column or use a function to verify it
create policy "Rooms are viewable by everyone"
  on public.rooms for select
  using ( true );

-- Allow authenticated users to create rooms
create policy "Users can create rooms"
  on public.rooms for insert
  with check ( auth.uid() = created_by );

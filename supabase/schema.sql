-- Create a table for rooms
create table public.rooms (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id),
  password text, -- Nullable. If null, room is public.
  name text
);

-- Create index for slug lookups
create index rooms_slug_idx on public.rooms(slug);

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

-- Allow anonymous users to create rooms (if created_by is null)
create policy "Anonymous can create rooms"
  on public.rooms for insert
  with check ( created_by is null );

-- Allow room creators to delete their own rooms
create policy "Users can delete their own rooms"
  on public.rooms for delete
  using ( auth.uid() = created_by );


-- Create a table for chat messages
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  sender_id uuid references auth.users(id),
  sender_name text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create index for room message queries
create index messages_room_id_idx on public.messages(room_id);
create index messages_created_at_idx on public.messages(created_at);

-- Set up Row Level Security (RLS)
alter table public.messages enable row level security;

-- Allow anyone to read messages
create policy "Messages are viewable by everyone"
  on public.messages for select
  using ( true );

-- Allow anyone to insert messages (for guest users too)
create policy "Anyone can insert messages"
  on public.messages for insert
  with check ( true );


-- ============================================
-- Cleanup job for inactive anonymous rooms
-- ============================================

-- Function to cleanup anonymous rooms inactive for more than 3 hours
-- An anonymous room is one where created_by is null
-- We consider "inactive" based on the room creation time since we don't track activity
-- A more sophisticated approach would track last_activity_at timestamp

create or replace function public.cleanup_inactive_anonymous_rooms()
returns integer
language plpgsql
security definer
as $$
declare
  deleted_count integer;
begin
  -- Delete anonymous rooms (created_by is null) that are older than 3 hours
  with deleted as (
    delete from public.rooms
    where created_by is null
      and created_at < now() - interval '3 hours'
    returning id
  )
  select count(*) into deleted_count from deleted;
  
  return deleted_count;
end;
$$;

-- Grant execute permission to the service role (for cron job)
grant execute on function public.cleanup_inactive_anonymous_rooms() to service_role;

-- Schedule the cleanup job to run every hour
-- Note: This requires the pg_cron extension enabled in your Supabase project
-- Enable it via Dashboard > Database > Extensions > pg_cron

-- Uncomment the following once pg_cron is enabled:
select cron.schedule(
  'cleanup-anonymous-rooms',    -- job name
  '0 * * * *',                  -- every hour at minute 0
  $$select public.cleanup_inactive_anonymous_rooms()$$
);

-- Alternative: You can also call this function from an Edge Function 
-- triggered by a scheduled task if pg_cron is not available.


-- ============================================
-- Optional: Add last_activity_at for better tracking
-- ============================================

-- If you want more accurate inactivity tracking:
-- alter table public.rooms add column last_activity_at timestamp with time zone default timezone('utc'::text, now());
-- 
-- Then update the cleanup function to use last_activity_at instead of created_at
-- and update last_activity_at when messages are sent or players join


-- ============================================
-- Drink History for Ketal Game
-- ============================================

-- Table to store drink history for authenticated users
create table public.drink_history (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references public.rooms(id) on delete cascade not null,
  session_id text not null, -- game session identifier
  source_trystero_id text not null, -- P2P peer ID of the source player
  source_user_id uuid references auth.users(id), -- Supabase user ID (nullable for guests)
  source_name text not null,
  target_trystero_id text not null, -- P2P peer ID of the target player
  target_user_id uuid references auth.users(id), -- Supabase user ID (nullable for guests)
  target_name text not null,
  amount integer not null check (amount > 0),
  direction text not null check (direction in ('drink', 'give')),
  phase text not null check (phase in ('phase1', 'pyramid')),
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for efficient querying
create index drink_history_room_id_idx on public.drink_history(room_id);
create index drink_history_session_id_idx on public.drink_history(session_id);
create index drink_history_source_user_id_idx on public.drink_history(source_user_id);
create index drink_history_target_user_id_idx on public.drink_history(target_user_id);
create index drink_history_created_at_idx on public.drink_history(created_at);

-- Set up Row Level Security (RLS)
alter table public.drink_history enable row level security;

-- Allow anyone to read drink history
create policy "Drink history is viewable by everyone"
  on public.drink_history for select
  using ( true );

-- Allow anyone to insert drink history (game host inserts for all players)
create policy "Anyone can insert drink history"
  on public.drink_history for insert
  with check ( true );

-- View to get player statistics across all games
create or replace view public.player_drink_stats as
select
  target_user_id as user_id,
  count(*) as total_drinks,
  sum(amount) as total_sips_taken,
  count(distinct session_id) as games_played,
  max(created_at) as last_played
from public.drink_history
where target_user_id is not null and direction in ('drink', 'give')
group by target_user_id;

-- View to get player giving statistics
create or replace view public.player_give_stats as
select
  source_user_id as user_id,
  sum(amount) as total_sips_given,
  count(distinct session_id) as games_played
from public.drink_history
where source_user_id is not null and direction = 'give' and source_user_id != target_user_id
group by source_user_id;

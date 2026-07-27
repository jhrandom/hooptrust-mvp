-- A player may use different jersey numbers for different teams or games.
alter table public.stats
  add column jersey_number int check (jersey_number between 0 and 999);

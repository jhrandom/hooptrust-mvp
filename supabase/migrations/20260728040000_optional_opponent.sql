-- Some evidence may be submitted before the opponent is known.
alter table public.games
  alter column opponent drop not null;

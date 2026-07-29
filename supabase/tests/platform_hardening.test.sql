begin;
select plan(24);

select has_table('public', 'guardian_player_links', 'guardian links table exists');
select has_table('public', 'coach_references', 'coach references table exists');
select has_table('public', 'player_teams', 'player teams table exists');
select has_table('public', 'profile_change_history', 'profile history table exists');
select has_table('public', 'notification_outbox', 'notification outbox exists');
select has_table('public', 'api_rate_limits', 'rate-limit table exists');

select has_column('public', 'players', 'height_cm', 'standard height exists');
select has_column('public', 'players', 'weight_kg', 'standard weight exists');
select has_column('public', 'videos', 'is_highlight', 'highlight flag exists');
select has_column('public', 'videos', 'highlight_order', 'highlight order exists');
select has_column('public', 'recruiters', 'verification_expires_at', 'recruiter verification expires');
select has_column('public', 'stats', 'submitted_values', 'original stats are retained');

select has_function('public', 'submit_game_evidence', array['text','date','text','text','text','text','text','jsonb'], 'atomic evidence RPC exists');
select has_function('public', 'consume_rate_limit', array['text','integer','integer'], 'rate-limit RPC exists');
select has_function('public', 'set_video_highlight', array['uuid','boolean','integer'], 'highlight RPC exists');
select has_function('public', 'link_guardian_by_email', array['uuid','text'], 'guardian-link RPC exists');
select has_function('public', 'apply_retention_policy', array[]::text[], 'retention RPC exists');
select has_function('public', 'is_public_player', array['uuid'], 'public-profile guard exists');

select has_view('public', 'public_player_profiles', 'restricted public profile view exists');
select isnt_empty(
  $$select 1 from pg_policies where schemaname='public' and tablename='videos' and roles @> array['anon']::name[]$$,
  'approved-video anon policy exists'
);
select isnt_empty(
  $$select 1 from pg_policies where schemaname='public' and tablename='guardian_player_links'$$,
  'guardian links have RLS policies'
);
select isnt_empty(
  $$select 1 from pg_policies where schemaname='public' and tablename='notification_outbox'$$,
  'notification outbox has RLS policies'
);
select col_is_null('public', 'notification_outbox', 'sent_at', 'unsent notifications permit null sent time');
select col_not_null('public', 'notification_outbox', 'status', 'notification status is required');

select * from finish();
rollback;

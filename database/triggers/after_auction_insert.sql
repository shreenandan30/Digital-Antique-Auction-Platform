-- The authoritative dump already defines after_auction_insert. Do not CREATE,
-- DROP, or replace it. It sets current_status = 'Auctioned'.
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'antique_auction_db'
  AND trigger_name = 'after_auction_insert';

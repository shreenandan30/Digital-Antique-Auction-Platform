-- The authoritative dump already defines this view. Do not CREATE, DROP, or
-- replace it. Its exact columns are auction_id, auction_name, item_name,
-- base_price, start_date, end_date, status.
SELECT auction_id, auction_name, item_name, base_price, start_date, end_date, status
FROM auction_details;

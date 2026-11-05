# Indexes

`npm run db:setup` checks `information_schema.statistics` by table and leading indexed column. The dump already has indexes for `auction.status`, `bid.auction_id`, `bid.bidder_id`, `valuation.item_id`, and `transaction.auction_id`; setup reuses them. It adds `auction.start_date`, `antique_item.category`, and `antique_item.current_status` indexes only when absent. `bidder.email` is already indexed. The `UNIQUE` constraint on `user_account.email` indexes account email, so setup does not add a duplicate.

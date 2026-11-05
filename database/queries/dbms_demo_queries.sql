USE antique_auction_db;

-- SELECT, WHERE, ORDER BY; estimated values come from valuation, not antique_item.
SELECT i.item_id, i.name, i.category, i.condition_status, i.current_status,
       v.estimated_value
FROM antique_item i
LEFT JOIN valuation v ON v.valuation_id = (
  SELECT v2.valuation_id FROM valuation v2
  WHERE v2.item_id = i.item_id
  ORDER BY v2.valuation_date DESC, v2.valuation_id DESC LIMIT 1
)
WHERE i.current_status = 'Available'
ORDER BY v.estimated_value DESC;

-- INNER JOIN: auction and antique details through the preserved project view.
SELECT auction_id, auction_name, item_name, base_price, start_date, end_date, status
FROM auction_details;

-- LEFT JOIN: retain antiques that have no auction.
SELECT i.item_id, i.name, a.auction_id
FROM antique_item i LEFT JOIN auction a ON a.item_id = i.item_id
ORDER BY i.name;

-- GROUP BY, COUNT and HAVING.
SELECT category, COUNT(*) AS item_count
FROM antique_item GROUP BY category
HAVING COUNT(*) >= 1 ORDER BY item_count DESC;

-- SUM, AVG, MAX and MIN over bids.
SELECT SUM(bid_amount) AS total_bids, AVG(bid_amount) AS average_bid,
       MAX(bid_amount) AS highest_bid, MIN(bid_amount) AS lowest_bid
FROM bid;

-- UPDATE and DELETE examples are intentionally commented to protect sample data.
-- UPDATE antique_item SET current_status = 'Available' WHERE item_id = 8;
-- DELETE FROM bid WHERE bid_id = -1;

-- Nested query: items valued above the average latest item valuation.
SELECT i.name, v.estimated_value
FROM antique_item i
JOIN valuation v ON v.valuation_id = (
  SELECT v2.valuation_id FROM valuation v2
  WHERE v2.item_id = i.item_id
  ORDER BY v2.valuation_date DESC, v2.valuation_id DESC LIMIT 1
)
WHERE v.estimated_value > (
  SELECT AVG(latest.estimated_value)
  FROM valuation latest
  WHERE latest.valuation_id = (
    SELECT v3.valuation_id FROM valuation v3
    WHERE v3.item_id = latest.item_id
    ORDER BY v3.valuation_date DESC, v3.valuation_id DESC LIMIT 1
  )
);

-- Correlated query: highest bid for each auction.
SELECT d.auction_id, d.auction_name, d.item_name,
       (SELECT MAX(b.bid_amount) FROM bid b WHERE b.auction_id = d.auction_id) AS highest_bid
FROM auction_details d;

-- Stored objects are added only if missing by npm run db:setup.
CALL GetAuctionDetails(1);
SELECT GetHighestBid(1);

-- Example application transaction outline. The app uses GET_LOCK to serialize
-- MAX(bid_id)+1 allocation across concurrent requests and supplies bid_id in INSERT.
-- START TRANSACTION;
-- SELECT GET_LOCK('antique_auction_db:bid_id_allocator', 10);
-- SELECT COALESCE(MAX(bid_id), 0) + 1 FROM bid;
-- INSERT INTO bid (bid_id, auction_id, bidder_id, bid_amount, bid_time)
-- VALUES (<allocated_id>, 1, 1, 250001.00, NOW());
-- COMMIT;
-- SELECT RELEASE_LOCK('antique_auction_db:bid_id_allocator');
-- ROLLBACK instead of COMMIT whenever validation fails.

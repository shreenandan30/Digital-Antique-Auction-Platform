-- npm run db:setup creates this procedure only when it is absent.
-- It reads auction information from the existing auction_details view.
DELIMITER $$
CREATE PROCEDURE GetAuctionDetails(IN p_auction_id INT)
BEGIN
  SELECT d.auction_id, d.auction_name, d.item_name AS antique_name,
         d.base_price, d.start_date, d.end_date, d.status,
         COALESCE((SELECT MAX(b.bid_amount)
                   FROM bid b WHERE b.auction_id=d.auction_id), 0) AS highest_bid
  FROM auction_details d
  WHERE d.auction_id = p_auction_id;
END$$
DELIMITER ;

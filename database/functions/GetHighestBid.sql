-- Run only if GetHighestBid is absent. npm run db:setup checks first.
DELIMITER $$
CREATE FUNCTION GetHighestBid(p_auction_id INT)
RETURNS DECIMAL(12,2)
DETERMINISTIC READS SQL DATA
BEGIN
  DECLARE v_highest DECIMAL(12,2);
  SELECT COALESCE(MAX(bid_amount), 0) INTO v_highest
  FROM bid WHERE auction_id = p_auction_id;
  RETURN v_highest;
END$$
DELIMITER ;

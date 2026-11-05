export const latestValuationJoin = `LEFT JOIN valuation val ON val.valuation_id = (
  SELECT v2.valuation_id FROM valuation v2
  WHERE v2.item_id = i.item_id
  ORDER BY v2.valuation_date DESC, v2.valuation_id DESC LIMIT 1
)`;

export const antiqueSelect = `SELECT i.*, val.estimated_value, val.valuation_date
FROM antique_item i ${latestValuationJoin}`;

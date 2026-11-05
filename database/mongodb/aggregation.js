// Run with mongosh against antique_auction_nosql.
use('antique_auction_nosql');
db.auction_activity.aggregate([
  { $group: { _id: '$action', count: { $sum: 1 } } },
  { $sort: { count: -1 } }
]);
db.auction_activity.aggregate([
  { $match: { action: 'VIEW_AUCTION' } },
  { $group: { _id: '$entityId', views: { $sum: 1 } } },
  { $sort: { views: -1 } }, { $limit: 5 }
]);

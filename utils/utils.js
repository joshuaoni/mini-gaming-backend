const client = require("../config/redisClient");

async function invalidateCache(userId) {
  client.del(`balance:${userId}`, (err, response) => {
    if (err) {
      console.error('Error deleting balance cache', err);
    } else {
      console.log('Balance cache invalidated');
    }
  });

  const pattern = `transactions:${userId}:*`;

  const scanAndDelete = async (cursor) => {
    client.scan(cursor, 'MATCH', pattern, 'COUNT', 100, (err, res) => {
      if (err) {
        console.error('Error scanning keys for invalidation', err);
        return;
      }

      const [nextCursor, keys] = res;
      if (keys.length > 0) {
        client.del(keys, (delErr) => {
          if (delErr) {
            console.error('Error deleting transaction keys', delErr);
          } else {
            console.log(`Deleted transaction keys pattern.`);
          }
        });
      }

      if (nextCursor !== '0') {
        scanAndDelete(nextCursor);
      }
    });
  };

  scanAndDelete('0');
}

module.exports = { invalidateCache }
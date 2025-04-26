const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres.gbdkepsurtoncfqhmogx:[password]@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres',
    ssl: { rejectUnauthorized: false },
})

module.exports = pool;
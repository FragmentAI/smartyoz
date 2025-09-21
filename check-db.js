import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: "postgresql://neondb_owner:npg_RVg0ElihL9Zu@ep-bitter-flower-ad2xh9bb-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
});

async function checkDatabase() {
  try {
    await client.connect();
    console.log('✅ Database connected successfully');
    
    // Check existing tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log('\n📋 Existing tables:');
    tables.rows.forEach(row => {
      console.log(`- ${row.table_name}`);
    });
    
    // Check if we have the main tables we need
    const requiredTables = ['candidates', 'tests', 'test_sessions', 'questions', 'users', 'sessions'];
    const existingTableNames = tables.rows.map(row => row.table_name);
    
    console.log('\n🔍 Required tables check:');
    requiredTables.forEach(table => {
      const exists = existingTableNames.includes(table);
      console.log(`${exists ? '✅' : '❌'} ${table}`);
    });

    // Check users table structure
    if (existingTableNames.includes('users')) {
      const userColumns = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND table_schema = 'public'
      `);
      console.log('\n👤 Users table columns:');
      userColumns.rows.forEach(row => {
        console.log(`- ${row.column_name}: ${row.data_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await client.end();
  }
}

checkDatabase();

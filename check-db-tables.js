const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkTables() {
  try {
    console.log('🔍 Checking for ai_qa_chunks table...');
    
    // Check if ai_qa_chunks table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_qa_chunks'
      );
    `;
    console.log('ai_qa_chunks table exists:', tableExists[0].exists);
    
    // If it exists, get its structure
    if (tableExists[0].exists) {
      const structure = await sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'ai_qa_chunks'
        ORDER BY ordinal_position;
      `;
      console.log('📋 ai_qa_chunks table structure:');
      structure.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Get sample data if any exists
      const sampleData = await sql`SELECT * FROM ai_qa_chunks LIMIT 3`;
      console.log('📊 Sample ai_qa_chunks data:', sampleData.length, 'rows');
      if (sampleData.length > 0) {
        console.log(sampleData[0]);
      }
    }
    
    // Also check evaluations table structure for comparison
    console.log('\n🔍 Checking evaluations table structure...');
    const evalStructure = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'evaluations'
      ORDER BY ordinal_position;
    `;
    console.log('📋 evaluations table structure:');
    evalStructure.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // List all tables in the public schema
    console.log('\n🔍 All tables in public schema:');
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    allTables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkTables();

const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    // Check ai_interview_sessions structure
    const sessionColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'ai_interview_sessions' 
      ORDER BY ordinal_position;
    `;
    console.log('ai_interview_sessions columns:');
    sessionColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Sample data from ai_interview_sessions
    try {
      const sessionSample = await sql`SELECT * FROM ai_interview_sessions LIMIT 1`;
      console.log('\nai_interview_sessions sample data:', sessionSample);
    } catch (error) {
      console.log('No data in ai_interview_sessions or table does not exist');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema().then(() => process.exit(0));

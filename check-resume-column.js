import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();
const sql = neon(process.env.DATABASE_URL);

async function checkResumeColumn() {
  try {
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'candidates' 
      ORDER BY ordinal_position;
    `;
    
    console.log('📋 Candidates table columns:');
    result.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    const hasResumeText = result.some(col => col.column_name === 'resume_text');
    console.log(`\n🔍 resumeText column exists: ${hasResumeText ? '✅ Yes' : '❌ No'}`);
    
    if (!hasResumeText) {
      console.log('\n🛠️ Adding resume_text column...');
      await sql`ALTER TABLE candidates ADD COLUMN resume_text TEXT`;
      console.log('✅ resume_text column added successfully');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkResumeColumn();

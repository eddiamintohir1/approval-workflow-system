import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

async function setupDatabase() {
  try {
    console.log('Reading schema file...');
    const schema = readFileSync('./supabase_schema.sql', 'utf8');
    
    console.log('Executing schema...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: schema });
    
    if (error) {
      // If exec_sql doesn't exist, try direct execution via REST API
      console.log('Trying alternative method...');
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql: schema }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Schema executed successfully!');
    } else {
      console.log('Schema executed successfully!');
      console.log('Result:', data);
    }
  } catch (error) {
    console.error('Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();

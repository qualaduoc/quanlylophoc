import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf-8');
const envVars = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('=').map(str => str.trim()))
);

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: students } = await supabase.from('students').select('*').limit(1);
  if (students && students.length > 0) {
      const { data, error } = await supabase.from('behavior_records').insert({
         student_id: students[0].id,
         type: 'bonus',
         description: 'test',
         score: 1,
         timestamp: 1234567,
         status: 'pending_president',
         created_by: 'a06283ff-cc91-447a-8fbb-7cfa8ebfac9c'
      }).select();
      console.log("Error:", error);
  }
}
check();

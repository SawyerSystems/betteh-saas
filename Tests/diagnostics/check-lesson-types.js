import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = 'https://nwdgtdzrcyfmislilucy.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLessonTypes() {
  const { data, error } = await supabase.from('lesson_types').select('*');
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Lesson types:', JSON.stringify(data, null, 2));
  }
}

checkLessonTypes();

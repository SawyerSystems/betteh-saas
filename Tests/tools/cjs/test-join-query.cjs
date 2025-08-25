const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testJoinQuery() {
  console.log('=== Testing Join Query ===');
  
  try {
    const { data, error } = await supabaseAdmin
      .from('waivers')
      .select(`
        signed_at, 
        relationship_to_athlete,
        understands_risks,
        agrees_to_policies,
        authorizes_emergency_care,
        allows_photo_video,
        confirms_authority,
        parents!waivers_parent_id_fkey(first_name, last_name)
      `)
      .eq('id', 18)
      .single();
      
    if (error) {
      console.error('Join query error:', error);
    } else {
      console.log('Join query success:', JSON.stringify(data, null, 2));
      
      if (data && data.parents) {
        const parent = data.parents;
        const signerName = `${parent.first_name} ${parent.last_name}`;
        console.log('Extracted signer name:', signerName);
        
        const agreements = {
          relationship: data.relationship_to_athlete,
          understands_risks: data.understands_risks,
          agrees_to_policies: data.agrees_to_policies,
          authorizes_emergency_care: data.authorizes_emergency_care,
          allows_photo_video: data.allows_photo_video,
          confirms_authority: data.confirms_authority
        };
        console.log('Extracted agreements:', agreements);
      }
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

testJoinQuery();

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function run() {
  const sql = `
    create policy "Public can view active pricing rules"
      on public.pricing_rules
      for select
      to public
      using (is_active = true);
    `;
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
  console.log(error ? error : "Success via RPC");
}
run()

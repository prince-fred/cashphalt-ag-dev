import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function checkSchema() {
    console.log('Checking properties table...')

    // We can't directly inspect schema via JS client easily without running SQL
    // enabling pgTAP or similar, but we can try to insert a dummy record and see error
    // or select and look at the structure if we have any data.

    // Let's rely on the error from the server action which was "Failed to save property"
    // which effectively swallows the real error.

    // Changing approach: I will modify the server action to LOG the real error.
    // But first, let's try to verify if `logo_url` column exists by selecting it.

    const { data, error } = await supabase
        .from('properties')
        .select('logo_url')
        .limit(1)

    if (error) {
        console.error('Error selecting logo_url:', error)
    } else {
        console.log('Successfully selected logo_url. Column likely exists.')
    }
}

checkSchema()

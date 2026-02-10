import { createClient } from '@supabase/supabase-js'
import { loadEnvConfig } from '@next/env'

// Load env vars
loadEnvConfig(process.cwd())

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase credentials in .env.local')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkBucket() {
    console.log('Checking for property-assets bucket...')
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) {
        console.error('Error listing buckets:', error)
        return
    }

    const bucket = buckets.find(b => b.name === 'property-assets')
    if (bucket) {
        console.log('✅ Bucket "property-assets" exists.')
        console.log('Public:', bucket.public)
    } else {
        console.error('❌ Bucket "property-assets" DOES NOT exist.')
        console.log('Available buckets:', buckets.map(b => b.name).join(', '))
    }
}

checkBucket()

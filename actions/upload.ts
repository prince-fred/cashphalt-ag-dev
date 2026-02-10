'use server'

import { createClient } from '@/utils/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function uploadPropertyLogo(formData: FormData) {
    const file = formData.get('file') as File
    if (!file) {
        throw new Error('No file provided')
    }

    const supabase = await createClient()

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        throw new Error('User not authenticated')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${uuidv4()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await supabase.storage
        .from('property-assets')
        .upload(filePath, buffer, {
            contentType: file.type,
            upsert: false
        })

    if (error) {
        console.error('Error uploading logo:', error)
        throw new Error(`Failed to upload logo: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
        .from('property-assets')
        .getPublicUrl(filePath)

    return publicUrl
}

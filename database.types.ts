export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    stripe_connect_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    stripe_connect_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    stripe_connect_id?: string | null
                    created_at?: string
                }
            }
            properties: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    slug: string
                    timezone: string
                    allocation_mode: 'SPOT' | 'ZONE'
                    max_booking_duration_hours: number
                    qr_enabled: boolean
                    sms_enabled: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    slug: string
                    timezone?: string
                    allocation_mode?: 'SPOT' | 'ZONE'
                    max_booking_duration_hours?: number
                    qr_enabled?: boolean
                    sms_enabled?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    slug?: string
                    timezone?: string
                    allocation_mode?: 'SPOT' | 'ZONE'
                    max_booking_duration_hours?: number
                    qr_enabled?: boolean
                    sms_enabled?: boolean
                    created_at?: string
                }
            }
            pricing_rules: {
                Row: {
                    id: string
                    property_id: string
                    priority: number
                    name: string | null
                    days_of_week: number[] | null
                    start_time: string | null
                    end_time: string | null
                    is_active: boolean
                    rate_type: 'FLAT' | 'HOURLY'
                    amount_cents: number
                    created_at: string
                }
            }
            sessions: {
                Row: {
                    id: string
                    property_id: string
                    spot_id: string | null
                    start_time: string
                    end_time_initial: string
                    end_time_current: string
                    status: 'CREATED' | 'PENDING_PAYMENT' | 'ACTIVE' | 'COMPLETED' | 'EXPIRED'
                    payment_intent_id: string | null
                    total_price_cents: number
                    customer_email: string | null
                    customer_phone: string | null
                    vehicle_plate: string | null
                    created_at: string
                }
            }
        }
    }
}

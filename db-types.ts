export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    email: string
                    full_name: string | null
                    role: 'admin' | 'property_owner' | 'staff'
                    organization_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    full_name?: string | null
                    role?: 'admin' | 'property_owner' | 'staff'
                    organization_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    full_name?: string | null
                    role?: 'admin' | 'property_owner' | 'staff'
                    organization_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    stripe_connect_id: string | null
                    platform_fee_percent: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    stripe_connect_id?: string | null
                    platform_fee_percent?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    stripe_connect_id?: string | null
                    platform_fee_percent?: number
                    created_at?: string
                }
                Relationships: []
            }
            properties: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    slug: string
                    address: string | null
                    hourly_rate_cents: number
                    price_hourly_cents: number // Alias or duplicate? Code uses price_hourly_cents.
                    image_url: string | null
                    logo_url: string | null
                    allocation_mode: 'ZONE' | 'SPOT'
                    max_booking_duration_hours: number
                    timezone: string
                    qr_enabled: boolean
                    sms_enabled: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    slug: string
                    address?: string | null
                    hourly_rate_cents?: number
                    price_hourly_cents?: number
                    image_url?: string | null
                    logo_url?: string | null
                    allocation_mode?: 'ZONE' | 'SPOT'
                    max_booking_duration_hours?: number
                    timezone?: string
                    qr_enabled?: boolean
                    sms_enabled?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    slug?: string
                    address?: string | null
                    hourly_rate_cents?: number
                    price_hourly_cents?: number
                    image_url?: string | null
                    logo_url?: string | null
                    allocation_mode?: 'ZONE' | 'SPOT'
                    max_booking_duration_hours?: number
                    timezone?: string
                    qr_enabled?: boolean
                    sms_enabled?: boolean
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "properties_organization_id_fkey"
                        columns: ["organization_id"]
                        isOneToOne: false
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            sessions: {
                Row: {
                    id: string
                    property_id: string
                    unit_id: string | null
                    vehicle_plate: string
                    customer_email: string | null
                    customer_phone: string | null
                    start_time: string
                    end_time: string
                    end_time_initial: string
                    amount_cents: number
                    total_price_cents: number
                    status: 'active' | 'completed' | 'cancelled' | 'PENDING_PAYMENT' | 'ACTIVE' | 'COMPLETED' | 'CREATED'
                    payment_intent_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    unit_id?: string | null
                    vehicle_plate: string
                    customer_email?: string | null
                    customer_phone?: string | null
                    start_time: string
                    end_time: string
                    end_time_initial?: string
                    amount_cents: number
                    total_price_cents?: number
                    status?: 'active' | 'completed' | 'cancelled' | 'PENDING_PAYMENT' | 'ACTIVE' | 'COMPLETED' | 'CREATED'
                    payment_intent_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    unit_id?: string | null
                    vehicle_plate?: string
                    customer_email?: string | null
                    customer_phone?: string | null
                    start_time?: string
                    end_time?: string
                    end_time_initial?: string
                    amount_cents?: number
                    total_price_cents?: number
                    status?: 'active' | 'completed' | 'cancelled' | 'PENDING_PAYMENT' | 'ACTIVE' | 'COMPLETED' | 'CREATED'
                    payment_intent_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "sessions_property_id_fkey"
                        columns: ["property_id"]
                        isOneToOne: false
                        referencedRelation: "properties"
                        referencedColumns: ["id"]
                    }
                ]
            }
            parking_units: {
                Row: {
                    id: string
                    property_id: string
                    name: string
                    is_occupied: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    name: string
                    is_occupied?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    name?: string
                    is_occupied?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            pricing_rules: {
                Row: {
                    id: string
                    property_id: string
                    priority: number
                    name: string | null
                    description: string | null
                    days_of_week: number[] | null
                    start_time: string | null
                    end_time: string | null
                    min_duration_minutes: number | null
                    max_duration_minutes: number | null
                    rate_type: 'HOURLY' | 'FLAT' | 'DAILY'
                    amount_cents: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    priority: number
                    name?: string | null
                    description?: string | null
                    days_of_week?: number[] | null
                    start_time?: string | null
                    end_time?: string | null
                    min_duration_minutes?: number | null
                    max_duration_minutes?: number | null
                    rate_type: 'HOURLY' | 'FLAT' | 'DAILY'
                    amount_cents: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    priority?: number
                    name?: string | null
                    description?: string | null
                    days_of_week?: number[] | null
                    start_time?: string | null
                    end_time?: string | null
                    min_duration_minutes?: number | null
                    max_duration_minutes?: number | null
                    rate_type?: 'HOURLY' | 'FLAT' | 'DAILY'
                    amount_cents?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            discounts: {
                Row: {
                    id: string
                    property_id: string
                    code: string
                    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
                    amount: number
                    usage_limit: number | null
                    usage_count: number
                    expires_at: string | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    property_id: string
                    code: string
                    type: 'PERCENTAGE' | 'FIXED_AMOUNT'
                    amount: number
                    usage_limit?: number | null
                    usage_count?: number
                    expires_at?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    property_id?: string
                    code?: string
                    type?: 'PERCENTAGE' | 'FIXED_AMOUNT'
                    amount?: number
                    usage_limit?: number | null
                    usage_count?: number
                    expires_at?: string | null
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            session_pricing_snapshots: {
                Row: {
                    id: string
                    session_id: string
                    snapshot_data: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    snapshot_data?: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    snapshot_data?: Json
                    created_at?: string
                }
                Relationships: []
            }
            session_transactions: {
                Row: {
                    id: string
                    session_id: string
                    amount_cents: number
                    status: string
                    payment_intent_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    session_id: string
                    amount_cents: number
                    status: string
                    payment_intent_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    session_id?: string
                    amount_cents?: number
                    status?: string
                    payment_intent_id?: string
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export interface Venue {
    id: number;
    name: string;
    images?: string[];
}

export interface Sport {
    id: number;
    name: string;
}

export interface Customer {
    id?: number;
    name: string;
    email: string;
    phone: string;
}

export interface SlotMeta {
    booking_id: number;
    user_id?: number;
    customer: string;
    email?: string;
    phone: string;
    start_time: string;
    end_time: string;
    status: string;
    payment_status?: string;
    total_price: number;
    notes?: string;
}

export interface PricingRule {
    days: number[];
    start_time: string;
    end_time: string;
    price: number | '';
    price_2_hours?: number | '';
}

export interface Court {
    id: number;
    venue_id: number;
    sport_id: number;
    name: string;
    type: 'indoor' | 'outdoor';
    price_per_hour: number;
    is_active: boolean;
    is_booked_now: boolean;
    pricing_rules?: PricingRule[];
    venue: Venue;
    sport: Sport;
    images?: string[];
    booked_slots?: string[];
    slot_meta?: Record<string, SlotMeta>;
}

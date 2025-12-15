import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Merchant = {
  id: string;
  email: string;
  name: string;
  phone: string;
  qr_code_data?: string;
  logo_base64?: string;
  business_name?: string;
  business_address?: string;
  business_city?: string;
  business_postal_code?: string;
  created_at: string;
};

export type MerchantBordereau = {
  id: string;
  merchant_id: string;
  bordereau_code: string;
  status: "available" | "assigned" | "used";
  exchange_id?: string;
  printed_at?: string;
  assigned_at?: string;
  used_at?: string;
  created_at: string;
};

export type MiniDepot = {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  created_at: string;
};

export type Transporter = {
  id: string;
  name: string;
  phone: string;
  created_at: string;
};

export type Exchange = {
  id: string;
  exchange_code: string;
  merchant_id: string;
  client_name: string;
  client_phone: string;
  reason: string;
  status: string;
  photos: string[];
  images?: string[];
  video?: string;
  mini_depot_id?: string;
  transporter_id?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  exchange_id: string;
  sender_type: "client" | "merchant";
  message: string;
  created_at: string;
};

export type StatusHistory = {
  id: string;
  exchange_id: string;
  status: string;
  created_at: string;
};

export type DeliveryPerson = {
  id: string;
  email: string;
  name: string;
  phone: string;
  created_at: string;
};

export type DeliveryVerification = {
  id: string;
  exchange_id: string;
  delivery_person_id: string;
  status: "accepted" | "rejected";
  rejection_reason?: string;
  bag_id?: string;
  payment_collected?: boolean;
  amount_collected?: number;
  payment_method?: "cash" | "card" | "mobile_payment" | "other";
  collection_notes?: string;
  created_at: string;
};

// Financial Transaction Types
export type TransactionType =
  | "collection_from_client"
  | "settlement_to_partner"
  | "settlement_to_admin"
  | "merchant_charge"
  | "refund_to_client"
  | "fee_deduction"
  | "invoice_generated"
  | "invoice_paid"
  | "adjustment";

export type TransactionStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | "disputed";

export type FinancialTransaction = {
  id: string;
  exchange_id?: string;
  delivery_person_id?: string;
  merchant_id?: string;
  settlement_id?: string;
  invoice_id?: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  direction: "credit" | "debit";
  status: TransactionStatus;
  description?: string;
  reference_code?: string;
  created_by?: string;
  created_at: string;
  metadata?: Record<string, unknown>;
};

// Settlement Types
export type SettlementType =
  | "to_delivery_partner"
  | "to_admin"
  | "bank_transfer";
export type SettlementStatus =
  | "pending"
  | "confirmed"
  | "disputed"
  | "cancelled";

export type DeliveryPersonSettlement = {
  id: string;
  delivery_person_id: string;
  settlement_type: SettlementType;
  amount: number;
  currency: string;
  period_start: string;
  period_end: string;
  exchanges_count: number;
  status: SettlementStatus;
  confirmed_by?: string;
  confirmed_at?: string;
  confirmation_notes?: string;
  receipt_reference?: string;
  created_at: string;
};

// Invoice Types
export type InvoiceStatus =
  | "draft"
  | "generated"
  | "sent"
  | "paid"
  | "disputed"
  | "cancelled";

export type WeeklyInvoice = {
  id: string;
  invoice_number: string;
  week_number: number;
  year: number;
  period_start: string;
  period_end: string;
  total_exchanges_handled: number;
  total_amount_collected: number;
  total_fees: number;
  total_commissions: number;
  net_payable: number;
  delivery_person_breakdown?: DeliveryPersonBreakdown[];
  status: InvoiceStatus;
  payment_due_date?: string;
  paid_at?: string;
  paid_amount?: number;
  payment_reference?: string;
  generated_by?: string;
  generated_at?: string;
  notes?: string;
  created_at: string;
};

export type DeliveryPersonBreakdown = {
  delivery_person_id: string;
  delivery_person_name: string;
  exchanges_handled: number;
  amount_collected: number;
  amount_settled: number;
  pending_settlement: number;
};

export type InvoiceLineItemType =
  | "exchange_handling"
  | "collection_amount"
  | "delivery_fee"
  | "commission"
  | "adjustment"
  | "penalty"
  | "bonus";

export type InvoiceLineItem = {
  id: string;
  invoice_id: string;
  line_type: InvoiceLineItemType;
  description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  exchange_id?: string;
  delivery_person_id?: string;
  created_at: string;
};

// Financial Summary Types
export type DeliveryPersonFinancialSummary = {
  total_collected: number;
  total_settled: number;
  pending_settlement: number;
  exchanges_with_collection: number;
  last_settlement_date?: string;
};

export type AdminFinancialSummary = {
  total_collected_from_clients: number;
  total_merchant_charges: number;
  total_settled_by_delivery: number;
  total_pending_settlement: number;
  total_transferred_to_partner: number;
  outstanding_from_partner: number;
  current_week_stats: {
    exchanges_count: number;
    amount_collected: number;
    settlements_count: number;
  };
};

export const EXCHANGE_STATUSES = {
  PENDING: "pending",
  VALIDATED: "validated",
  PREPARING: "preparing",
  IN_TRANSIT: "in_transit",
  DELIVERY_VERIFIED: "delivery_verified",
  DELIVERY_REJECTED: "delivery_rejected",
  COMPLETED: "completed",
  RETURNED: "returned",
  REJECTED: "rejected",
} as const;

export const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  validated: "Validé",
  preparing: "Préparation mini-dépôt",
  in_transit: "En route",
  delivery_verified: "Vérifié par livreur",
  delivery_rejected: "Refusé par livreur",
  completed: "Échange effectué",
  returned: "Produit retourné",
  rejected: "Rejeté",
};

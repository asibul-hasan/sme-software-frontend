/**
 * Doctor & Prescriptions Domain Models
 * Direct 1:1 field mapping to PostgreSQL schema in `db_script.sql`.
 * Tables: `doc_doctors`, `doc_prescription_settings`, `doc_prescriptions`, `doc_prescription_items`.
 */
import { ProdProduct } from './product.models';
import { CustCustomer } from './customer.models';

export interface DocDoctor {
  doctor_no: number;
  pharmacy_no: number;
  branch_no?: number;
  first_name_en: string;
  last_name_en?: string | null;
  first_name_bn?: string | null;
  last_name_bn?: string | null;
  phone: string;
  gender: number;
  description_en?: string | null;
  description_bn?: string | null;
  password_hash?: string | null;
  signature_image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocPrescriptionSetting {
  prescription_setting_no: number;
  pharmacy_no: number;
  branch_no?: number;
  clinic_logo_url?: string | null;
  prescription_bottom_row_text?: string | null;
  updated_at: string;
}

export interface DocPrescription {
  prescription_no: number;
  prescription_code: string;
  pharmacy_no: number;
  branch_no?: number;
  doctor_no: number;
  customer_no?: number | null;
  patient_name: string;
  patient_age?: string | null;
  patient_gender: number;
  clinical_notes?: string | null;
  created_at: string;

  // Navigation
  doctor?: DocDoctor;
  customer?: CustCustomer;
  items?: readonly DocPrescriptionItem[];
}

export interface DocPrescriptionItem {
  prescription_item_no: number;
  pharmacy_no: number;
  branch_no?: number;
  prescription_no: number;
  product_no?: number | null;
  medicine_name: string;
  dosage: string;
  instructions?: string | null;
  duration?: string | null;

  // Navigation
  product?: ProdProduct;
}

// Backward-compatible type aliases
export type Doctor = DocDoctor;
export type PrescriptionSetting = DocPrescriptionSetting;
export type Prescription = DocPrescription;
export type PrescriptionItem = DocPrescriptionItem;

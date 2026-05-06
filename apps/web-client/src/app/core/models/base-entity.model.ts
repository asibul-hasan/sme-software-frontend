export interface BaseEntity {
  created_by?: number | null;
  created_at?: string | null;
  updated_by?: number | null;
  updated_at?: string | null;
  is_deleted?: number | null;
  deleted_by?: number | null;
  deleted_at?: string | null;
}


export interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  
  // Personal
  father_name?: string;
  mother_name?: string;
  dob?: string;
  gender?: string;
  blood_group?: string;
  nid?: string;
  passport_no?: string;
  marital_status?: string;
  religion?: string;
  photo_url?: string;

  // Contact
  present_address?: string;
  permanent_address?: string;
  mobile: string;
  emergency_contact?: string;
  email?: string;

  // Employment
  designation_id?: number;
  designation?: { id: number, name: string }; // Relation
  department_id?: number;
  department?: { id: number, name: string }; // Relation
  branch_ids?: number[];
  primary_branch_id?: number;
  primary_branch?: { id: number, name: string }; // Relation
  join_date: string;
  employment_type?: string;
  reporting_manager_id?: number;
  status: string; // Active, Inactive, etc.

  // Bank
  bank_name?: string;
  bank_branch?: string;
  account_number?: string;
  account_holder_name?: string;
  routing_number?: string;

  // Salary
  basic_salary?: number;
  house_rent?: number;
  medical_allowance?: number;
  conveyance_allowance?: number;
  other_allowance?: number;
  gross_salary?: number;

  // System
  created_at?: string;
  updated_at?: string;
  user_id?: number;
}

export interface CreateEmployeeDto extends Omit<Employee, 'id' | 'created_at' | 'updated_at' | 'employee_id'> {
    create_user?: boolean;
    username?: string;
    password?: string;
    role_id?: number;
}

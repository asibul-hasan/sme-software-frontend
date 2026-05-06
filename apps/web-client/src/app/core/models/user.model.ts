export interface User {
  user_no: number;
  user_name: string;
  name: string;
  email?: string;
  role?: string;
  designation?: string;
  company_no: number;
  company_name?: string;
  branch_no?: number;
  branch_name?: string;
  branch_ids?: number[];
  token?: string;
  refreshToken?: string;
}
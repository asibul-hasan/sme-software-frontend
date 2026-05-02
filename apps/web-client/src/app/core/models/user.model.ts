export interface User {
  user_no: number;
  name: string;
  email?: string;
  role?: string;
  designation?: string;
  company_no: number;
  branch_no?: number;
  branch_ids?: number[];
  token?: string;
  refreshToken?: string;
}
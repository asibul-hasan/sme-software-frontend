/**
 * Domain shape of an authenticated user as known to the frontend.
 *
 * Field names mirror the backend (snake_case) so JSON from the API maps
 * directly without transformation. Auth tokens are NOT part of this
 * model — they live separately in storage and are managed by AuthService.
 */
export interface User {
  user_no:      number;
  user_name:    string;
  /** Display name — falls back to `user_name` when not supplied by API. */
  name?:        string;
  email?:       string;
  role?:        string;
  designation?: string;
  employee_no?: number;

  // Tenant context — set on login from the company/branch the user picked.
  company_no:    number;
  company_name?: string;
  branch_no?:    number;
  branch_name?:  string;
  branch_ids?:   number[];
}

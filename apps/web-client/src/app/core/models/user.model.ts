export interface User {
    id: number; // Changed from string to number to match backend
    name: string;
    email: string;
    phone?: string;
    company_id: number;
    designation_id?: number;
    designation?: string;
    branch_ids?: number[]; // Changed from string[] to number[]
    // Optional compatibility fields if needed, but preferably remove if unused
    username?: string; 
    roles?: string[]; 
}
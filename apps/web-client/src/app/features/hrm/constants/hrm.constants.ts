/**
 * HRM module static enum / select-option lists — the single source of truth.
 * Per the CLAUDE.md rule, forms import these instead of hard-coding option arrays inline.
 * Every `value` mirrors the backend column it round-trips to (DB-first): numeric for
 * SMALLINT enum columns (the majority), char codes only where the column stores a char.
 */
export interface SelectOption {
  label: string;
  value: unknown;
}

export const hrmConstants = {
  // ── Employee master (HRM_1001) ──────────────────────────────────────────────
  genderOptions: [
    { value: 1, label: 'Male' },
    { value: 2, label: 'Female' },
    { value: 3, label: 'Other' },
  ],
  maritalStatusOptions: [
    { value: 1, label: 'Single' },
    { value: 2, label: 'Married' },
    { value: 3, label: 'Divorced' },
    { value: 4, label: 'Widowed' },
  ],
  employmentTypeOptions: [
    { value: 1, label: 'Permanent' },
    { value: 2, label: 'Contractual' },
    { value: 3, label: 'Probationary' },
    { value: 4, label: 'Intern' },
  ],
  employeeStatusOptions: [
    { value: 1, label: 'Active' },
    { value: 2, label: 'Resigned' },
    { value: 3, label: 'Terminated' },
    { value: 4, label: 'Retired' },
  ],
  bloodGroups: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  mfsProviders: ['bKash', 'Nagad', 'Rocket', 'Upay', 'SureCash'],

  // ── Setup (HRM_1005 / 1006 / 1007 / 1008) ──────────────────────────────────
  leaveAccrualMethods: [
    { value: 1, label: 'Annual (upfront)' },
    { value: 2, label: 'Monthly accrual' },
    { value: 3, label: 'None (on request)' },
  ],
  holidayTypes: [
    { value: 1, label: 'Public / Govt' },
    { value: 2, label: 'Religious' },
    { value: 3, label: 'Company' },
    { value: 4, label: 'Optional' },
  ],
  salaryComponentTypes: [
    { value: 1, label: 'Earning' },
    { value: 2, label: 'Deduction' },
    { value: 3, label: 'Employer Contribution' },
    { value: 4, label: 'Statutory Deduction' },
  ],
  salaryCalcTypes: [
    { value: 1, label: 'Fixed Amount' },
    { value: 2, label: '% of Basic' },
    { value: 3, label: '% of Gross' },
    { value: 4, label: 'Formula' },
  ],
  countryPacks: [
    { value: 'BD', label: 'Bangladesh (BD pack)' },
    { value: 'INTL', label: 'Global / Generic' },
  ],

  // ── Attendance & time (HRM_1101 / 1102 / 1103 / 1104 / 1105) ────────────────
  attendanceStatuses: [
    { value: 1, label: 'Present' },
    { value: 2, label: 'Absent' },
    { value: 3, label: 'Late' },
    { value: 4, label: 'Half Day' },
    { value: 5, label: 'Holiday' },
    { value: 6, label: 'Weekly Off' },
    { value: 7, label: 'On Leave' },
    { value: 8, label: 'Leave Without Pay' },
  ],
  adjustmentStatuses: [
    { value: 1, label: 'Pending' },
    { value: 2, label: 'Approved' },
    { value: 3, label: 'Rejected' },
  ],
  weekdays: [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ],
  rosterStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Published' },
    { value: 3, label: 'Cancelled' },
  ],
  overtimeStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Approved' },
    { value: 3, label: 'Cancelled' },
  ],

  // ── Movement (HRM_1106) ─────────────────────────────────────────────────────
  movementTypes: [
    { value: 1, label: 'Promotion' },
    { value: 2, label: 'Transfer' },
    { value: 3, label: 'Demotion' },
    { value: 4, label: 'Confirmation' },
    { value: 5, label: 'Redesignation' },
  ],
  movementStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Submitted' },
    { value: 3, label: 'Approved' },
    { value: 4, label: 'Cancelled' },
  ],

  // ── Payroll (HRM_1201 / 1202 / 1203 / 1204 / 1205 / 1206 / 1207) ────────────
  salaryStructureStatuses: [
    { value: 1, label: 'Active' },
    { value: 2, label: 'Superseded' },
    { value: 3, label: 'Draft' },
  ],
  payrollRunTypes: [
    { value: 1, label: 'Regular' },
    { value: 2, label: 'Supplementary' },
    { value: 3, label: 'Bonus' },
    { value: 4, label: 'Final Settlement' },
  ],
  payrollStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Calculated' },
    { value: 3, label: 'Approved' },
    { value: 4, label: 'Paid' },
    { value: 5, label: 'Cancelled' },
  ],
  bonusTypes: [
    { value: 1, label: 'Festival' },
    { value: 2, label: 'Performance' },
    { value: 3, label: 'Profit Share' },
    { value: 4, label: 'Other' },
  ],
  loanTypes: [
    { value: 1, label: 'Loan' },
    { value: 2, label: 'Advance' },
  ],
  loanStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Approved' },
    { value: 3, label: 'Disbursed' },
    { value: 4, label: 'Closed' },
    { value: 5, label: 'Cancelled' },
  ],
  separationTypes: [
    { value: 1, label: 'Resignation' },
    { value: 2, label: 'Termination' },
    { value: 3, label: 'Retirement' },
    { value: 4, label: 'End of Contract' },
    { value: 5, label: 'Death' },
  ],
  settlementStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Approved' },
    { value: 3, label: 'Paid' },
    { value: 4, label: 'Cancelled' },
  ],

  // ── Leave (HRM_1301) ────────────────────────────────────────────────────────
  leaveStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Applied' },
    { value: 3, label: 'Approved' },
    { value: 4, label: 'Rejected' },
    { value: 5, label: 'Cancelled' },
  ],

  // ── Recruitment (HRM_1401 / 1402 / 1404) ────────────────────────────────────
  requisitionEmploymentTypes: [
    { value: 1, label: 'Permanent' },
    { value: 2, label: 'Contract' },
    { value: 3, label: 'Part Time' },
    { value: 4, label: 'Intern' },
  ],
  requisitionStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Submitted' },
    { value: 3, label: 'Approved' },
    { value: 4, label: 'On Hold' },
    { value: 5, label: 'Closed' },
    { value: 6, label: 'Cancelled' },
  ],
  candidateSources: [
    { value: 1, label: 'Referral' },
    { value: 2, label: 'Job Board' },
    { value: 3, label: 'Walk-in' },
    { value: 4, label: 'Agency' },
    { value: 5, label: 'Internal' },
  ],
  candidateStatuses: [
    { value: 1, label: 'Applied' },
    { value: 2, label: 'Shortlisted' },
    { value: 3, label: 'Interviewing' },
    { value: 4, label: 'Selected' },
    { value: 5, label: 'Offered' },
    { value: 6, label: 'Hired' },
    { value: 7, label: 'Rejected' },
    { value: 8, label: 'Withdrawn' },
  ],
  offerStatuses: [
    { value: 1, label: 'Draft' },
    { value: 2, label: 'Sent' },
    { value: 3, label: 'Accepted' },
    { value: 4, label: 'Declined' },
    { value: 5, label: 'Expired' },
    { value: 6, label: 'Revoked' },
  ],
};

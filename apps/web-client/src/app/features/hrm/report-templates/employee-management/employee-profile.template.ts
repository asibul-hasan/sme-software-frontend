import { ColumnDef } from '../../../../shared/components/common-table';
import { PdfReportTemplate, ReportSection } from '../shared/pdf-report-template.types';

export interface EmployeeProfileReportContext {
  employee: Record<string, unknown>;
  departmentName?: string;
  designationName?: string;
  gradeName?: string;
  employmentType?: string;
  taxpayerClass?: string;
}

type ProfileRow = Record<string, unknown>;

const value = (row: Record<string, unknown>, key: string): unknown => row[key] ?? '';

const fieldRow = (section: string, field: string, fieldValue: unknown): ProfileRow => ({
  section,
  field,
  value: fieldValue ?? '',
});

const rowsForSection = (
  section: string,
  entries: Array<[string, unknown]>,
): ProfileRow[] => entries.map(([field, fieldValue]) => fieldRow(section, field, fieldValue));

export const employeeProfileColumns: ColumnDef[] = [
  { title: 'Section', field: 'section', width: '24%', cellType: 'text' },
  { title: 'Field', field: 'field', width: '28%', cellType: 'text' },
  { title: 'Value', field: 'value', width: '48%', cellType: 'text' },
];

export const employeeProfileReportTemplate: PdfReportTemplate<EmployeeProfileReportContext> = {
  id: 'HRM.employee-management.employee-profile',
  module: 'HRM',
  formId: 'HRM_1001',
  title: 'Employee Profile Report',
  fileName: 'employee-profile',
  columns: employeeProfileColumns,
  buildSections(context): ReportSection[] {
    const employee = context.employee;
    const fullName = [value(employee, 'first_name'), value(employee, 'middle_name'), value(employee, 'last_name')]
      .filter(Boolean)
      .join(' ');

    return [
      {
        title: 'Basic Information',
        rows: rowsForSection('Basic Information', [
          ['Employee ID', value(employee, 'employee_id')],
          ['Employee Name', fullName],
          ['Date of Birth', value(employee, 'date_of_birth')],
          ['Gender', value(employee, 'gender')],
          ['Blood Group', value(employee, 'blood_group')],
          ['Highest Education', value(employee, 'highest_education')],
        ]),
      },
      {
        title: 'Contact Information',
        rows: rowsForSection('Contact Information', [
          ['Mobile', value(employee, 'mobile_number')],
          ['Alternative Mobile', value(employee, 'alternative_mobile_number')],
          ['Official Email', value(employee, 'official_email')],
          ['Personal Email', value(employee, 'personal_email')],
          ['Emergency Contact', value(employee, 'emergency_contact_name')],
          ['Emergency Phone', value(employee, 'emergency_contact_number')],
        ]),
      },
      {
        title: 'Address Information',
        rows: rowsForSection('Address Information', [
          ['Present Address', value(employee, 'present_address')],
          ['Permanent Address', value(employee, 'permanent_address')],
        ]),
      },
      {
        title: 'Employment Information',
        rows: rowsForSection('Employment Information', [
          ['Department', context.departmentName],
          ['Designation', context.designationName],
          ['Grade', context.gradeName],
          ['Salary', value(employee, 'salary')],
          ['Employment Type', context.employmentType],
          ['Taxpayer Class', context.taxpayerClass],
          ['Joining Date', value(employee, 'joining_date')],
          ['Confirmation Date', value(employee, 'confirmation_date')],
        ]),
      },
      {
        title: 'Contract Information',
        rows: rowsForSection('Contract Information', [
          ['Contract Type', value(employee, 'contract_type')],
          ['Contract Start', value(employee, 'contract_start_date')],
          ['Contract End', value(employee, 'contract_end_date')],
          ['Contract Amount', value(employee, 'contract_amount')],
          ['Contract Notes', value(employee, 'contract_notes')],
        ]),
      },
      {
        title: 'Previous Work History',
        rows: rowsForSection('Previous Work History', [
          ['Experienced', value(employee, 'is_experienced') ? 'Yes' : 'No'],
          ['Experience Duration', value(employee, 'experience_duration')],
        ]),
      },
    ];
  },
  buildRows(context): ProfileRow[] {
    return this.buildSections?.(context).flatMap((section) => section.rows) ?? [];
  },
};

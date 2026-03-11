import { Component, OnInit, ViewChild } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { SharedModule } from 'apps/web-client/src/app/shared';
import { ToastrService } from 'ngx-toastr';
import {
  ColumnDef,
  RowData,
  SqlState,
  TableConfig,
} from 'apps/web-client/src/app/shared/components/data-table/data-table.models';
import { DataTableComponent } from 'apps/web-client/src/app/shared/components/data-table/data-table.component';

export interface BranchRow {
  branchName: string;
  branchCode: string;
  location: string;
  phone: string;
  manager: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sys1001.component.html',
  // styleUrls:   ['./sys1001.component.scss'],
})
export class Sys1001Component implements OnInit {
  @ViewChild(DataTableComponent) dataTable!: DataTableComponent;
  formdata: FormGroup = new FormGroup({});

  // ── Branch state ────────────────────────────────────────────────────
  branches: BranchRow[] = [
    {
      branchName: 'Head Office',
      branchCode: 'BR-01',
      location: 'New York, USA',
      phone: '+1 212 555 0100',
      manager: 'Alice Johnson',
      status: 'active',
    },
    {
      branchName: 'West Coast Hub',
      branchCode: 'BR-02',
      location: 'Los Angeles, USA',
      phone: '+1 310 555 0188',
      manager: 'Bob Martinez',
      status: 'active',
    },
    {
      branchName: 'EU Operations',
      branchCode: 'BR-03',
      location: 'Berlin, Germany',
      phone: '+49 30 555 0199',
      manager: 'Clara Müller',
      status: 'inactive',
    },
  ];

  // ── Table config ───────────────────────────────────────────────────
  tableConfig: TableConfig = {
    uniqueId: 'branch-table-sys1001',
    allowAdd: true,
    allowDelete: true,
    allowExport: true,
    allowColumnVisibility: true,
    allowRowSelection: false,
    pageSizeOptions: [5, 10, 25],
    hideAddButton: true,
  };

  tableColumns: ColumnDef[] = [
    {
      key: 'branchName',
      header: 'Branch Name',
      type: 'text',
      editable: false,
      required: true,
    },
    { key: 'branchCode', header: 'Branch Code', type: 'text', editable: true },
    { key: 'location', header: 'Location', type: 'text', editable: true },
    { key: 'phone', header: 'Phone Number', type: 'text', editable: true },
    { key: 'manager', header: 'Manager', type: 'text', editable: true },
    {
      key: 'status',
      header: 'Status',
      type: 'select',
      editable: true,
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
      ],
    },
  ];

  tableData: RowData[] = [];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {}

  ngOnInit(): void {
    this.formdata = new FormGroup({
      companyName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      companyAddress: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      companyPhone: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      companyEmail: new FormControl(''),
      companyWebsite: new FormControl(''),
      companyLogo: new FormControl(''),
      companySuffix: new FormControl(''),
      systemId: new FormControl(''),
      vendorType: new FormControl(''),
      regNo: new FormControl(''),
      regDate: new FormControl(''),

      fiscalYear: new FormControl(''),
    });

    // Populate initial table data
    this.tableData = this.branches.map((b) => ({
      ...b,
      sqlState: SqlState.UNCHANGED,
    }));
  }

  // ── Company actions ─────────────────────────────────────────────────
  onNew(): void {
    this.formdata.reset();
    this.toastr.info('Action: NEW');
  }
  onSave(): void {
    this.toastr.success('Record saved successfully.');
  }
  onReset(): void {
    this.formdata.reset();
    this.toastr.info('Action: RESET');
  }
  onDelete(): void {
    this.toastr.warning('Action: DELETE');
  }

  // ── Branch Table Event ──────────────────────────────────────────────
  onTableDataChange(latestData: RowData[]): void {
    this.tableData = latestData;
    // this.toastr.info('Branch details updated.');
  }

  onAddBranch(): void {
    // Rely on the data-table component's internal addRow()
    // which handles the edit mode and focus correctly.
    this.dataTable.addRow();
  }

  onRefreshBranch(): void {
    this.tableData = this.branches.map((b) => ({
      ...b,
      sqlState: SqlState.UNCHANGED,
    }));
    this.toastr.info('Branch list refreshed.');
  }
}

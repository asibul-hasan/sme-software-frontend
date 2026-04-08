import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { SharedModule } from '../../../../shared';

@Component({
  selector: 'app-sys1002',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './sys1002.component.html',
  styles: [],
})
export class Sys1002Component implements OnInit {
  formdata!: FormGroup;
  
  // Mock data for multiple branches
  branches = signal<any[]>([
    { id: 1, branchName: 'Downtown HQ', branchCode: 'HQ-001', branchType: 'headquarters', managerName: 'Alice Smith', phone: '(555) 123-4567', email: 'hq@company.com', address: '100 Main St, Cityville', status: 'active' },
    { id: 2, branchName: 'Northside Local', branchCode: 'LOC-102', branchType: 'local', managerName: 'Bob Johnson', phone: '(555) 987-6543', email: 'north@company.com', address: '200 North Ave, Cityville', status: 'active' },
    { id: 3, branchName: 'East Kiosk', branchCode: 'KSK-304', branchType: 'kiosk', managerName: 'Carol Davis', phone: '(555) 555-1212', email: 'east@company.com', address: 'Inside East Mall', status: 'inactive' }
  ]);

  searchTerm = signal('');

  filteredBranches = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const data = this.branches();
    if (!term) return data;
    return data.filter((b) => 
      (b.branchName || '').toLowerCase().includes(term) ||
      (b.branchCode || '').toLowerCase().includes(term) ||
      (b.managerName || '').toLowerCase().includes(term)
    );
  });
  
  selectedBranchId: number | null = null;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.formdata = this.fb.group({
      branchName: ['', Validators.required],
      branchCode: [''],
      branchType: [''],
      managerName: [''],
      phone: [''],
      email: [''],
      address: ['', Validators.required],
      status: ['active'],
    });
  }

  selectBranch(branch: any) {
    this.selectedBranchId = branch.id;
    this.formdata.patchValue(branch);
  }

  onSave() {
    console.log(this.formdata.value);
    // In a real app, update the branches array here
  }

  onNew() {
    this.selectedBranchId = null;
    this.formdata.reset({ status: 'active' });
  }

  onReset() {
    if (this.selectedBranchId) {
      const b = this.branches().find(x => x.id === this.selectedBranchId);
      this.formdata.patchValue(b);
    } else {
      this.formdata.reset({ status: 'active' });
    }
  }
}

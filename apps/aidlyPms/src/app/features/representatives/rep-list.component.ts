import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ModalService } from '../../core/services/modal.service';
import { RepresentativeService, SysRepresentative } from '../../core/services/representative.service';
import { RoleService, SysRole } from '../../core/services/role.service';
import { MenuActionDirective } from '../../shared/directives/menu-action.directive';

interface RepUser {
  id: string;
  userNo: number;
  name: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  roleNo: number;
  role: string;
  gender: string;
  isActive: boolean;
}

@Component({
  selector: 'app-rep-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzModalModule,
    NzIconModule,
    NzTagModule,
    NzTooltipModule,
    PageHeaderComponent,
    EmptyStateComponent,
    NzSpinModule,
    MenuActionDirective,
  ],
  templateUrl: './rep-list.component.html',
})
export class RepListComponent implements OnInit {
  private readonly msg = inject(NzMessageService);
  private readonly modal = inject(ModalService);
  private readonly repService = inject(RepresentativeService);
  private readonly roleService = inject(RoleService);

  searchQuery = '';
  reps = signal<RepUser[]>([]);
  isLoading = signal(false);
  hasError = signal(false);

  onEmptyTableAction(): void {
    if (this.hasError()) {
      this.loadReps();
    } else if (this.searchQuery.trim()) {
      this.searchQuery = '';
      this.loadReps();
    } else {
      this.openAddModal();
    }
  }
  availableRoles = signal<SysRole[]>([]);

  // Modal State
  isModalVisible = false;
  modalMode: 'create' | 'edit' = 'create';
  form = {
    id: '',
    userNo: 0,
    firstName: '',
    lastName: '',
    phoneSuffix: '',
    gender: 'Male',
    email: '',
    roleNo: null as number | null,
    password: '',
    confirmPassword: '',
  };

  // Pass Modal
  isPassOpen = false;
  activeRep: RepUser | null = null;
  newPassword = '';
  confirmNewPassword = '';

  ngOnInit(): void {
    this.loadRoles();
    this.loadReps();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res.data) {
          const roles = res.data.filter(r => r.role_no !== 1 && r.alias?.toLowerCase() !== 'admin');
          this.availableRoles.set(roles);
          if (!this.form.roleNo && roles.length > 0) {
            this.form.roleNo = roles[0].role_no;
          }
        }
      },
      error: () => {},
    });
  }

  loadReps(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    const params: Record<string, unknown> = {
      pageIndex: 1,
      pageSize: 100,
    };
    if (this.searchQuery.trim()) {
      params['search'] = this.searchQuery.trim();
    }

    this.repService.getRepresentatives(params).subscribe({
      next: (res) => {
        const rawItems = (res.data?.items || (Array.isArray(res.data) ? res.data : []))
          .filter((u: any) => (u.role_no || u.roleNo) !== 1 && (u.phone || '').toLowerCase() !== 'asibul');
        const rows: RepUser[] = rawItems.map((u: any) => ({
          id: (u.user_no || u.userNo || Math.random()).toString(),
          userNo: u.user_no || u.userNo,
          name: [u.first_name || u.firstName, u.last_name || u.lastName].filter(Boolean).join(' ') || 'Staff User',
          firstName: u.first_name || u.firstName || '',
          lastName: u.last_name || u.lastName || '',
          phone: u.phone || '',
          email: u.email || '',
          roleNo: u.role_no || u.roleNo || 1,
          role: u.role_name || u.roleName || 'Operator',
          gender: u.gender === 2 ? 'Female' : 'Male',
          isActive: u.is_active ?? true,
        }));
        this.reps.set(rows);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.hasError.set(true);
        this.msg.error(err?.error?.message || 'Failed to load representatives');
      },
    });
  }

  onSearchChange(): void {
    this.loadReps();
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.loadReps();
  }

  openAddModal(): void {
    this.modalMode = 'create';
    const roles = this.availableRoles();
    this.form = {
      id: '',
      userNo: 0,
      firstName: '',
      lastName: '',
      phoneSuffix: '',
      gender: 'Male',
      email: '',
      roleNo: roles.length > 0 ? roles[0].role_no : null,
      password: '',
      confirmPassword: '',
    };
    this.isModalVisible = true;
  }

  openEditModal(r: RepUser): void {
    this.modalMode = 'edit';
    const phoneClean = r.phone.replace(/^\+880\s*/, '');
    this.form = {
      id: r.id,
      userNo: r.userNo,
      firstName: r.firstName,
      lastName: r.lastName,
      phoneSuffix: phoneClean,
      gender: r.gender,
      email: r.email,
      roleNo: r.roleNo,
      password: '',
      confirmPassword: '',
    };
    this.isModalVisible = true;
  }

  saveRep(): void {
    if (!this.form.firstName.trim() || !this.form.lastName.trim()) {
      this.msg.error('Please enter first and last name');
      return;
    }
    if (!this.form.phoneSuffix.trim()) {
      this.msg.error('Please enter phone number');
      return;
    }
    if (!this.form.roleNo) {
      this.msg.error('Please select a role');
      return;
    }

    const fullPhone = `+880 ${this.form.phoneSuffix.trim()}`;
    const payload: Partial<SysRepresentative> = {
      first_name: this.form.firstName.trim(),
      last_name: this.form.lastName.trim(),
      phone: fullPhone,
      email: this.form.email.trim() || undefined,
      role_no: this.form.roleNo,
      gender: this.form.gender === 'Female' ? 2 : 1,
      is_active: true,
    };

    if (this.modalMode === 'create') {
      if (this.form.password && this.form.password !== this.form.confirmPassword) {
        this.msg.error('Passwords do not match');
        return;
      }
      this.repService.createRepresentative(payload).subscribe({
        next: (res) => {
          this.msg.success(res.message || `Staff member "${this.form.firstName} ${this.form.lastName}" created!`);
          this.isModalVisible = false;
          this.loadReps();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to create staff member');
        },
      });
    } else {
      this.repService.updateRepresentative(this.form.userNo, payload).subscribe({
        next: (res) => {
          this.msg.success(res.message || `Staff member "${this.form.firstName}" updated!`);
          this.isModalVisible = false;
          this.loadReps();
        },
        error: (err) => {
          this.msg.error(err?.error?.message || 'Failed to update staff member');
        },
      });
    }
  }

  openPassModal(r: RepUser): void {
    this.activeRep = r;
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.isPassOpen = true;
  }

  savePassword(): void {
    if (!this.activeRep) return;
    if (!this.newPassword || this.newPassword.length < 6) {
      this.msg.error('Password must be at least 6 characters');
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.msg.error('Passwords do not match');
      return;
    }
    this.repService.updateRepresentative(this.activeRep.userNo, { password: this.newPassword }).subscribe({
      next: (res) => {
        this.msg.success(res.message || `Password updated for ${this.activeRep?.name}!`);
        this.isPassOpen = false;
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to update password');
      }
    });
  }

  deleteRep(r: RepUser): void {
    this.modal.confirmAction(
      'Delete Representative?',
      `Are you sure you want to delete staff user "${r.name}"? This action cannot be undone.`,
      'Delete',
      true
    ).subscribe(confirmed => {
      if (confirmed) {
        this.repService.deleteRepresentative(r.userNo).subscribe({
          next: () => {
            this.msg.success(`Staff user "${r.name}" deleted successfully`);
            this.loadReps();
          },
          error: (err) => {
            this.msg.error(err?.error?.message || 'Failed to delete representative');
          },
        });
      }
    });
  }
}

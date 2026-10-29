import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { RepresentativeService } from '../../core/services/representative.service';
import { RoleService, SysRole } from '../../core/services/role.service';

@Component({
  selector: 'app-rep-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzIconModule,
    NzModalModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './rep-add.component.html',
})
export class RepAddComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly repService = inject(RepresentativeService);
  private readonly roleService = inject(RoleService);

  firstName = '';
  lastName = '';
  phone = '';
  gender = 'Male';
  email = '';
  roleNo: number | null = null;
  roles = signal<SysRole[]>([]);
  password = '';
  confirmPassword = '';

  isAddRoleModalOpen = false;
  newRoleName = '';

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (res) => {
        if (res.data) {
          const roles = res.data.filter(r => r.role_no !== 1 && r.alias?.toLowerCase() !== 'admin');
          this.roles.set(roles);
          if (!this.roleNo && roles.length > 0) {
            this.roleNo = roles[0].role_no;
          }
        }
      },
      error: () => {},
    });
  }

  openAddRoleModal(): void {
    this.newRoleName = '';
    this.isAddRoleModalOpen = true;
  }

  saveNewRole(): void {
    const val = this.newRoleName.trim();
    if (!val) {
      this.msg.error('Please enter a role name');
      return;
    }
    if (val.toLowerCase() === 'admin') {
      this.msg.error("The 'Admin' role name is reserved for system administrators.");
      return;
    }
    this.roleService.createRole({ alias: val, is_system: false }).subscribe({
      next: (res) => {
        this.msg.success(`Role "${val}" created!`);
        this.isAddRoleModalOpen = false;
        this.loadRoles();
        if (res.data?.role_no) {
          this.roleNo = res.data.role_no;
        }
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to create role');
      },
    });
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/representative']);
    }
  }

  submitForm(): void {
    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.msg.error('Please enter full name');
      return;
    }
    if (!this.phone.trim()) {
      this.msg.error('Please enter phone number');
      return;
    }
    if (!this.roleNo) {
      this.msg.error('Please select a role');
      return;
    }
    if (this.password && this.password !== this.confirmPassword) {
      this.msg.error('Passwords do not match');
      return;
    }

    const fullPhone = `+880 ${this.phone.trim()}`;
    this.repService.createRepresentative({
      first_name: this.firstName.trim(),
      last_name: this.lastName.trim(),
      phone: fullPhone,
      gender: this.gender === 'Female' ? 2 : 1,
      email: this.email.trim() || undefined,
      role_no: this.roleNo,
      is_active: true,
    }).subscribe({
      next: (res) => {
        this.msg.success(res.message || `Staff member "${this.firstName} ${this.lastName}" registered!`);
        this.router.navigate(['/representative']);
      },
      error: (err) => {
        this.msg.error(err?.error?.message || 'Failed to register representative');
      },
    });
  }
}

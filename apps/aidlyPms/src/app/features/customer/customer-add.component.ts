import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CustomerService } from '../../core/services/customer.service';
import { CustCustomer } from '../../core/models';

@Component({
  selector: 'app-customer-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzIconModule,
    NzModalModule,
    NzTooltipModule,
    PageHeaderComponent,
  ],
  templateUrl: './customer-add.component.html',
})
export class CustomerAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);

  private readonly customerService = inject(CustomerService);

  name = '';
  phone = '';
  gender = 'Male';
  type = 'Regular';
  customerTypes = ['Regular', 'Wholesale Client', 'VIP', 'Staff', 'Doctor Referral'];
  discountPercent = 0;
  email = '';
  dueEnabled = false;
  dueAmount = 0;
  dueDate = '';
  address = '';
  note = '';
  loyalty = false;

  isAddCustomerTypeOpen = false;
  newCustomerTypeName = '';

  saveNewCustomerType(): void {
    const val = this.newCustomerTypeName.trim();
    if (!val) {
      this.msg.error('Customer type name is required');
      return;
    }
    if (!this.customerTypes.includes(val)) {
      this.customerTypes.push(val);
    }
    this.type = val;
    this.isAddCustomerTypeOpen = false;
    this.msg.success(`Customer type "${val}" added!`);
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/customer/list']);
    }
  }

  submitForm(): void {
    if (!this.name.trim()) {
      this.msg.error('Please enter customer name');
      return;
    }
    if (!this.phone.trim()) {
      this.msg.error('Please enter customer phone');
      return;
    }

    const typeCode = this.type === 'Doctor Referral' ? 2 : (this.type === 'VIP' ? 3 : (this.type === 'Wholesale Client' ? 4 : 1));

    const payload: Partial<CustCustomer> = {
      name: this.name.trim(),
      phone: `+880 ${this.phone.trim()}`,
      customer_type: typeCode,
      gender: this.gender === 'Female' ? 2 : 1,
      discount_percent: this.discountPercent,
      email: this.email,
      total_due: this.dueEnabled ? Number(this.dueAmount) || 0 : 0,
      address: this.address.trim() || 'Local Area',
      notes: this.note,
      is_loyalty_member: this.loyalty,
      is_active: true,
    };

    this.customerService.createCustomer(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.msg.success(`Customer "${this.name}" registered successfully!`);
          this.router.navigate(['/customer/list']);
        } else {
          this.msg.error(res.message || 'Failed to register customer');
        }
      },
      error: (err) => this.msg.error(err?.error?.message || 'Failed to register customer'),
    });
  }
}

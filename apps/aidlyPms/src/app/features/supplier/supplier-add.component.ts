import { Component, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SupplierService } from '../../core/services/supplier.service';

@Component({
  selector: 'app-supplier-add',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NzInputModule,
    NzButtonModule,
    NzCheckboxModule,
    NzIconModule,
    PageHeaderComponent,
  ],
  templateUrl: './supplier-add.component.html',
})
export class SupplierAddComponent {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly msg = inject(NzMessageService);
  private readonly supplierService = inject(SupplierService);

  name = '';
  phone = '';
  address = '';
  note = '';
  dueEnabled = false;
  openingDue = 0;

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
    } else {
      this.router.navigate(['/supplier/list']);
    }
  }

  submitForm(): void {
    if (!this.name.trim()) {
      this.msg.error('Please enter supplier name');
      return;
    }
    if (!this.phone.trim()) {
      this.msg.error('Please enter supplier phone number');
      return;
    }

    const fullPhone = `+880 ${this.phone.trim()}`;
    const balance = this.dueEnabled ? Number(this.openingDue) || 0 : 0;
    this.supplierService.createSupplier({
      name: this.name.trim(),
      phone: fullPhone,
      current_due_balance: balance,
      note: this.note.trim(),
    }).subscribe({
      next: () => {
        this.msg.success(`Supplier "${this.name}" created successfully!`);
        this.router.navigate(['/supplier/list']);
      },
      error: (err: any) => {
        this.msg.error(err?.error?.message || 'Failed to create supplier');
      },
    });
  }
}

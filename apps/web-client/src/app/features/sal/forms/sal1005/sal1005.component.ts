import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sal1005DataService } from './services/data.service';
import { Sal1005ModelService } from './services/model.service';

/**
 * SAL_1005 — POS Terminal Setup.
 *
 * The first POS screen to fill in: a cashier cannot open a drawer, and therefore
 * cannot sell, until a terminal exists for the branch.
 */
@Component({
  selector: 'app-sal1005',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Sal1005DataService, Sal1005ModelService],
  templateUrl: './sal1005.component.html',
  styles: [`:host { display: block; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sal1005Component implements OnInit {
  readonly model = inject(Sal1005ModelService);
  readonly permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SAL_1005');
    this.model.initForm();
    this.model.loadLookups();
    this.model.loadList();
  }

  onSave(): void { this.model.save(); }
  onNew(): void { this.model.newTerminal(); }
  onDelete(): void { this.model.remove(); }
}

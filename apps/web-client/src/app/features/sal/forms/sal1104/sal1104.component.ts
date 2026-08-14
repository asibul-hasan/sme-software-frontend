import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../../../shared/shared.module';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { Sal1104DataService } from './services/data.service';
import { PROMO_TYPES, SCOPE_TYPES, Sal1104ModelService, WEEKDAYS } from './services/model.service';

/**
 * SAL_1104 — Promotions.
 *
 * The form only shows the fields the chosen promo type actually uses, so a rule
 * cannot be saved carrying settings that contradict it.
 */
@Component({
  selector: 'app-sal1104',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, SharedModule, PageFormLayoutComponent],
  providers: [Sal1104DataService, Sal1104ModelService],
  templateUrl: './sal1104.component.html',
  styles: [`:host { display: block; height: 100%; }`],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sal1104Component implements OnInit {
  readonly model = inject(Sal1104ModelService);
  readonly permissionService = inject(FormPermissionService);

  readonly promoTypes = PROMO_TYPES;
  readonly scopeTypes = SCOPE_TYPES;
  readonly weekdays = WEEKDAYS;

  targetPick: number | null = null;
  rewardPick: number | null = null;

  ngOnInit(): void {
    this.permissionService.useLocalPermissions('SAL_1104');
    this.model.initForm();
    this.model.loadLookups();
    this.model.loadList();
  }

  addCondition(): void {
    if (this.targetPick == null) return;
    this.model.addTarget(this.targetPick, 1);
    this.targetPick = null;
  }

  addReward(): void {
    if (this.rewardPick == null) return;
    this.model.addTarget(this.rewardPick, 2);
    this.rewardPick = null;
  }

  onSave(): void { this.model.save(); }
  onNew(): void { this.model.newPromotion(); this.targetPick = null; this.rewardPick = null; }
  onDelete(): void { this.model.remove(); }
}

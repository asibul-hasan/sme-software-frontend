import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inv2006DataService } from './services/data.service';
import { COUNT_TYPES, Inv2006ModelService } from './services/model.service';

/**
 * INV_2006 — Physical Count.
 *
 * Open a sheet (which snapshots the warehouse), count, review the variance, post.
 * Posting hands the difference to INV_1102 as a Count adjustment, so stock only
 * ever moves through the one write path.
 */
@Component({
  selector: 'app-inv2006',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [Inv2006DataService, Inv2006ModelService],
  templateUrl: './inv2006.component.html',
  styleUrls: ['./inv2006.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Inv2006Component implements OnInit {
  readonly model = inject(Inv2006ModelService);
  readonly countTypes = COUNT_TYPES;

  ngOnInit(): void {
    this.model.loadWarehouses();
    this.model.loadList();
  }

  /** Posting moves real stock, so a non-zero variance gets one deliberate confirmation. */
  confirmPost(): void {
    const variances = this.model.varianceCount();
    if (variances > 0) {
      const value = this.model.varianceValue().toFixed(2);
      const ok = confirm(
        `Post ${variances} variance line(s) worth ${value}?\n\n` +
        `This adjusts stock through a Count adjustment.`);
      if (!ok) return;
    }
    this.model.post();
  }
}

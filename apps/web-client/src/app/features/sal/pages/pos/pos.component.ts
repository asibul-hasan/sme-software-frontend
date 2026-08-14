import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PosDataService } from './services/data.service';
import { PosHoldStore } from './services/hold-store.service';
import { PAYMENT_METHODS, PosModelService } from './services/model.service';

/**
 * SAL_1001 — the till.
 *
 * Full-screen and keyboard-first: a cashier works this with a scanner and the
 * function keys, rarely the mouse. The scan field keeps focus so a scanner's
 * keystrokes always land somewhere useful.
 */
@Component({
  selector: 'app-pos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [PosDataService, PosHoldStore, PosModelService],
  templateUrl: './pos.component.html',
  styleUrls: ['./pos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PosComponent implements OnInit {
  readonly m = inject(PosModelService);
  readonly methods = PAYMENT_METHODS;

  private scanInput = viewChild<ElementRef<HTMLInputElement>>('scanBox');

  scanValue = '';
  openingFloat = 0;
  tenderMethod = 1;
  tenderAmount: number | null = null;
  tenderCash: number | null = null;

  readonly holdCount = computed(() => this.m.holds.carts().length);
  readonly showHelp = signal(false);

  ngOnInit(): void {
    this.m.init();
  }

  // ── scanning ──────────────────────────────────────────────────────────────

  onScan(): void {
    const code = this.scanValue;
    this.scanValue = '';
    this.m.scan(code);
  }

  focusScan(): void {
    // Deferred so it survives the click that opened whatever we are closing.
    setTimeout(() => this.scanInput()?.nativeElement.focus(), 0);
  }

  // ── tender ────────────────────────────────────────────────────────────────

  openTender(): void {
    if (!this.m.lineCount()) return;
    // Pre-fill the balance: the common case is one tender for the whole sale.
    this.tenderAmount = this.m.balanceDue();
    this.tenderCash = null;
    this.m.showTender.set(true);
  }

  addTender(): void {
    const amount = this.tenderAmount ?? 0;
    if (amount <= 0) return;

    this.m.addTender(this.tenderMethod, amount,
      this.tenderMethod === 1 ? (this.tenderCash ?? amount) : undefined);

    this.tenderAmount = this.m.balanceDue() > 0 ? this.m.balanceDue() : null;
    this.tenderCash = null;
  }

  confirm(): void {
    this.m.confirm(() => {
      this.m.showTender.set(false);
      this.focusScan();
    });
  }

  // ── keyboard map ──────────────────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  onKey(event: KeyboardEvent): void {
    switch (event.key) {
      case 'F1':
        event.preventDefault(); this.focusScan(); break;
      case 'F8':
        event.preventDefault(); this.m.holdCart(); this.focusScan(); break;
      case 'F9':
        event.preventDefault(); this.openTender(); break;
      case 'F10':
        event.preventDefault(); if (this.m.canConfirm()) this.confirm(); break;
      case 'Escape':
        event.preventDefault();
        this.m.showTender.set(false);
        this.m.showHolds.set(false);
        this.showHelp.set(false);
        this.focusScan();
        break;
    }
  }

  methodName(value: number): string {
    return this.methods.find((x) => x.value === value)?.label ?? `#${value}`;
  }
}

import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Sal1003DataService } from './services/data.service';
import { Sal1003ModelService } from './services/model.service';

/**
 * SAL_1003 — POS Closing.
 *
 * Count the drawer, compare it to what the tenders say should be there, explain
 * any difference, then close. The Z-report is the same panel rendered for print.
 */
@Component({
  selector: 'app-sal1003',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [Sal1003DataService, Sal1003ModelService],
  templateUrl: './sal1003.component.html',
  styleUrls: ['./sal1003.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sal1003Component implements OnInit {
  readonly m = inject(Sal1003ModelService);

  ngOnInit(): void {
    this.m.loadSessions();
  }

  close(): void {
    this.m.close(() => {
      // Nothing else to do — the summary reloads and the form switches to read-only.
    });
  }

  print(): void {
    window.print();
  }

  statusLabel(status: number): string {
    return status === 3 ? 'Closed' : status === 2 ? 'Closing' : 'Open';
  }
}

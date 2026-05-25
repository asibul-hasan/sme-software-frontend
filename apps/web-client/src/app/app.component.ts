import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NgSelectConfig } from '@ng-select/ng-select';
import { SessionManagerService } from './core/services/session-manager.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Aidly ERP';
  private sessionManager = inject(SessionManagerService);
  private ngSelectConfig = inject(NgSelectConfig);

  constructor() {
    // Append ng-select dropdown panels to body globally to prevent clipping by parent overflow: hidden elements.
    this.ngSelectConfig.appendTo = 'body';
  }

  ngOnInit() {
    this.sessionManager.init();
  }
}


import { Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SessionManagerService } from './core/services/session-manager.service';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'Aidly ERP';
  private sessionManager = inject(SessionManagerService);

  ngOnInit() {
    this.sessionManager.init();
  }
}

import { Component, ChangeDetectionStrategy, Input, signal } from '@angular/core';
import { SharedModule } from '../../../shared';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  @Input() set sidebarCollapsed(val: boolean) {
    this.isCollapsed.set(val);
  }
  
  isCollapsed = signal(false);
  currentYear = new Date().getFullYear();

  onHelp(event: Event) {
    event.preventDefault();
  }

  onPrivacy(event: Event) {
    event.preventDefault();
  }
}

import { Component } from '@angular/core';
import { SharedModule } from '../../../shared';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [SharedModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  currentYear = new Date().getFullYear();

  onHelp(event: Event) {
    event.preventDefault();
  }

  onPrivacy(event: Event) {
    event.preventDefault();
  }
}

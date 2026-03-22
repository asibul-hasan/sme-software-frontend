import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <div class="auth-layout-wrapper">
      <router-outlet></router-outlet>
    </div>
  `,
  styleUrls: ['./auth-layout.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AuthLayoutComponent {}
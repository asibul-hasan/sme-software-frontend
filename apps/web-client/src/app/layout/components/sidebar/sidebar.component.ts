import { Component, signal, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule } from '@ngx-translate/core';
import { MenuItem, MENU_ITEMS } from './models/menu.model';
import { PermissionService } from '../../../core/services/permission.service';
import { MenuService } from './services/menu-builder.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule,
    MatBadgeModule,
    TranslateModule,
  ],
  templateUrl: './sidebar.component.html'
})
export class SidebarComponent {
  menuItems = signal<MenuItem[]>([]);
  
  @Input() set collapsed(val: boolean) {
    this.isCollapsed.set(val);
  }
  
  @Output() toggleCollapse = new EventEmitter<void>();

  isCollapsed = signal(false);

  constructor(
    private permissionService: PermissionService,
    private router: Router,
    private service: MenuService
  ) {
    const builtMap = this.service.buildMenu(this.service.menu);
    localStorage.setItem('menu', JSON.stringify(builtMap));
    this.menuItems.set(JSON.parse(localStorage.getItem('menu') || '[]'));
  }

  toggleSidebar() {
    this.toggleCollapse.emit();
  }

  private filterMenuItems() {
    // const filtered = MENU_ITEMS.filter(item => this.canShowMenuItem(item))
    //   .map(item => ({
    //     ...item,
    //     children: item.children?.filter(child => this.canShowMenuItem(child))
    //   }));

    // this.menuItems.set(filtered);
  }

  private canShowMenuItem(item: MenuItem): boolean {
    // If no module requirement, show it
    if (!item.module) return true;

    // Check if user has access to the module
    return this.permissionService.hasModule(item.module);
  }

  isActive(route?: string): boolean {
    if (!route) return false;
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  hasActiveChild(item: MenuItem): boolean {
    if (!item.children) return false;
    return item.children.some(child => this.isActive(child.route));
  }
}
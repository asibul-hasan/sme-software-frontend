import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import type { GridDensity } from '../enums/grid-enums';
import { GRID_DENSITY_ORDER } from '../enums/grid-enums';
import type { GridToolbarConfig } from '../models/grid-types';
import type { GridColumnToggle } from '../services/grid-column.service';

/**
 * Grid toolbar: search, refresh, exports, column chooser, density, layout reset, full screen.
 *
 * Purely presentational — it raises intent as outputs and holds no grid state of its own. That
 * keeps it testable in isolation and means the grid component remains the single place where
 * anything is actually performed.
 *
 * Every button is individually switchable through {@link GridToolbarConfig}, so a form shows the
 * actions that make sense for it rather than a fixed bar it has to work around.
 */
@Component({
  selector: 'app-grid-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, MatIconModule, MatMenuModule, MatTooltipModule],
  templateUrl: './grid-toolbar.component.html',
  styleUrl: './grid-toolbar.component.scss',
})
export class GridToolbarComponent {
  readonly config = input.required<GridToolbarConfig>();
  readonly searchText = input('');
  readonly columns = input<GridColumnToggle[]>([]);
  readonly density = input<GridDensity>('comfortable');
  readonly isFullScreen = input(false);
  readonly hasActiveFilters = input(false);

  readonly search = output<string>();
  readonly clearSearch = output<void>();
  readonly refresh = output<void>();
  readonly exportExcel = output<void>();
  readonly exportCsv = output<void>();
  readonly print = output<void>();
  readonly toggleColumn = output<string>();
  readonly showAllColumns = output<void>();
  readonly autoFit = output<void>();
  readonly resetLayout = output<void>();
  readonly densityChange = output<GridDensity>();
  readonly toggleFullScreen = output<void>();

  readonly densities = GRID_DENSITY_ORDER;

  /** True when at least one action other than search is enabled — hides an empty divider. */
  hasActions(): boolean {
    const c = this.config();
    return !!(
      c.refresh ||
      c.exportExcel ||
      c.exportCsv ||
      c.print ||
      c.columnChooser ||
      c.autoFit ||
      c.resetLayout ||
      c.density ||
      c.fullScreen
    );
  }

  densityIcon(density: GridDensity): string {
    switch (density) {
      case 'compact':
        return 'density_small';
      case 'spacious':
        return 'density_large';
      default:
        return 'density_medium';
    }
  }

  densityLabel(density: GridDensity): string {
    return density.charAt(0).toUpperCase() + density.slice(1);
  }

  onSearchInput(value: string): void {
    this.search.emit(value);
  }
}

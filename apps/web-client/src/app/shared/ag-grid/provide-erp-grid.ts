import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';

/**
 * Registers AG Grid Community modules once globally for Angular 21 application initialization.
 */
export function provideErpGrid(): EnvironmentProviders {
  ModuleRegistry.registerModules([AllCommunityModule]);
  return makeEnvironmentProviders([]);
}

import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { sysMenuTypeOptions } from '../../../../../core/constants/common-options.constants';
import { isSuccess } from '../../../../../core/models/response.model';
import { Sys1201DataService } from './data.service';

export interface Option {
  value: number;
  label: string;
}

export interface ModuleRow {
  module_no?: number | null;
  module_code: string;
  module_name: string;
  module_desc?: string | null;
  module_icon?: string | null;
  module_route?: string | null;
  order_sl?: number | null;
  is_active?: number | null;
  row_version?: number;
}

export interface SubmoduleRow {
  submodule_no?: number | null;
  module_no: number | null;
  module_name?: string | null;
  submodule_code: string;
  submodule_name: string;
  submodule_icon?: string | null;
  submodule_route?: string | null;
  order_sl?: number | null;
  is_active?: number | null;
  row_version?: number;
}

export interface MenuRow {
  menu_no?: number | null;
  submodule_no: number | null;
  submodule_name?: string | null;
  module_name?: string | null;
  form_id: string;
  form_name: string;
  menu_desc?: string | null;
  menu_type?: string | null;
  route_path?: string | null;
  icon_name?: string | null;
  order_sl?: number | null;
  is_active?: number | null;
  row_version?: number;
}

type Tab = 'modules' | 'submodules' | 'menus';

const emptyModule = (): ModuleRow => ({ module_code: '', module_name: '', order_sl: 0, is_active: 1 });
const emptySubmodule = (): SubmoduleRow => ({ module_no: null, submodule_code: '', submodule_name: '', order_sl: 0, is_active: 1 });
const emptyMenu = (): MenuRow => ({ submodule_no: null, form_id: '', form_name: '', menu_type: 'FORM', order_sl: 0, is_active: 1 });

/**
 * View-model for SYS1201 Dynamic Menu Builder — vendor maintenance of the global catalog
 * (modules → submodules → menus). Three tabs, each a list + edit pane.
 */
@Injectable()
export class Sys1201ModelService {
  private data = inject(Sys1201DataService);
  private toastr = inject(ToastrService);

  activeTab = signal<Tab>('modules');
  isLoading = signal(false);
  isSaving = signal(false);

  modules = signal<ModuleRow[]>([]);

  filteredModules = computed(() => {
    return [...this.modules()].sort((a, b) => (b.module_no || 0) - (a.module_no || 0));
  });
  submodules = signal<SubmoduleRow[]>([]);
  menus = signal<MenuRow[]>([]);
  moduleOptions = signal<Option[]>([]);
  submoduleOptions = signal<Option[]>([]);

  moduleForm = signal<ModuleRow>(emptyModule());
  submoduleForm = signal<SubmoduleRow>(emptySubmodule());
  menuForm = signal<MenuRow>(emptyMenu());

  // Filters
  submoduleFilterModule = signal<number | null>(null);
  menuFilterModule = signal<number | null>(null);
  menuFilterSubmodule = signal<number | null>(null);

  filteredSubmodules = computed(() => {
    const filterMod = this.submoduleFilterModule();
    let list = this.submodules();
    if (filterMod) list = list.filter(s => s.module_no === filterMod);
    return list.sort((a, b) => (b.submodule_no || 0) - (a.submodule_no || 0));
  });

  menuFilterSubmoduleOptions = computed(() => {
    const filterMod = this.menuFilterModule();
    let list = this.submodules();
    if (filterMod) list = list.filter(s => s.module_no === filterMod);
    return list.map(s => ({ value: s.submodule_no!, label: s.submodule_name }));
  });

  filteredMenus = computed(() => {
    const filterMod = this.menuFilterModule();
    const filterSub = this.menuFilterSubmodule();
    const list = this.menus().filter(m => {
      if (filterSub && m.submodule_no !== filterSub) return false;
      if (filterMod) {
        const sm = this.submodules().find(s => s.submodule_no === m.submodule_no);
        if (!sm || sm.module_no !== filterMod) return false;
      }
      return true;
    });
    return list.sort((a, b) => (b.menu_no || 0) - (a.menu_no || 0));
  });

  readonly menuTypeOptions = sysMenuTypeOptions;

  recordCount = computed(() => {
    switch (this.activeTab()) {
      case 'modules': return this.modules().length;
      case 'submodules': return this.filteredSubmodules().length;
      default: return this.filteredMenus().length;
    }
  });

  // ── lifecycle ──────────────────────────────────────────────────────────────
  loadAll(): void {
    this.loadModules();
    this.refreshOptions();
    this.loadSubmodules();
    this.loadMenus();
  }

  refreshOptions(): void {
    this.data.getModuleOptions().subscribe({
      next: (r) => {
        if (isSuccess(r) && r.data) this.moduleOptions.set(r.data);
        else this.toastr.error(r.message || 'Could not load module options');
      },
      error: (e) => this.showLoadError(e, 'module options'),
    });
    this.data.getSubmoduleOptions().subscribe({
      next: (r) => {
        if (isSuccess(r) && r.data) this.submoduleOptions.set(r.data);
        else this.toastr.error(r.message || 'Could not load submodule options');
      },
      error: (e) => this.showLoadError(e, 'submodule options'),
    });
  }

  setTab(tab: Tab): void {
    this.activeTab.set(tab);
  }

  // ── Modules ──────────────────────────────────────────────────────────────────
  loadModules(): void {
    this.isLoading.set(true);
    this.data.getModules().pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: (r) => {
        if (isSuccess(r) && r.data) this.modules.set(r.data);
        else this.toastr.error(r.message || 'Could not load modules');
      },
      error: (e) => this.showLoadError(e, 'modules'),
    });
  }
  newModule(): void { this.moduleForm.set(emptyModule()); }
  editModule(m: ModuleRow): void { this.moduleForm.set({ ...m }); }
  saveModule(): void {
    const f = this.moduleForm();
    if (!f.module_code?.trim() || !f.module_name?.trim()) { this.toastr.warning('Code and name are required.'); return; }
    this.isSaving.set(true);
    this.data.saveModule(f).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (r) => {
        if (isSuccess(r)) { this.toastr.success('Module saved'); this.newModule(); this.loadModules(); this.refreshOptions(); }
        else this.toastr.error(r.message || 'Save failed');
      },
      error: (e) => this.toastr.error(e?.error?.message || 'API error during save'),
    });
  }
  deleteModule(no: number): void {
    this.data.deleteModule(no).subscribe({
      next: (r) => { if (isSuccess(r)) { this.toastr.success('Module deleted'); this.newModule(); this.loadModules(); this.refreshOptions(); } else this.toastr.error(r.message || 'Delete failed'); },
      error: (e) => this.toastr.error(e?.error?.message || 'API error during delete'),
    });
  }

  // ── Submodules ────────────────────────────────────────────────────────────────
  loadSubmodules(): void {
    this.data.getSubmodules().subscribe({
      next: (r) => {
        if (isSuccess(r) && r.data) this.submodules.set(r.data);
        else this.toastr.error(r.message || 'Could not load submodules');
      },
      error: (e) => this.showLoadError(e, 'submodules'),
    });
  }
  newSubmodule(): void { this.submoduleForm.set(emptySubmodule()); }
  editSubmodule(s: SubmoduleRow): void { this.submoduleForm.set({ ...s }); }
  saveSubmodule(): void {
    const f = this.submoduleForm();
    if (!f.module_no) { this.toastr.warning('Select a module.'); return; }
    if (!f.submodule_code?.trim() || !f.submodule_name?.trim()) { this.toastr.warning('Code and name are required.'); return; }
    this.isSaving.set(true);
    this.data.saveSubmodule(f).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (r) => {
        if (isSuccess(r)) { this.toastr.success('Submodule saved'); this.newSubmodule(); this.loadSubmodules(); this.refreshOptions(); }
        else this.toastr.error(r.message || 'Save failed');
      },
      error: (e) => this.toastr.error(e?.error?.message || 'API error during save'),
    });
  }
  deleteSubmodule(no: number): void {
    this.data.deleteSubmodule(no).subscribe({
      next: (r) => { if (isSuccess(r)) { this.toastr.success('Submodule deleted'); this.newSubmodule(); this.loadSubmodules(); this.refreshOptions(); } else this.toastr.error(r.message || 'Delete failed'); },
      error: (e) => this.toastr.error(e?.error?.message || 'API error during delete'),
    });
  }

  // ── Menus ─────────────────────────────────────────────────────────────────────
  loadMenus(): void {
    this.data.getMenus().subscribe({
      next: (r) => {
        if (isSuccess(r) && r.data) this.menus.set(r.data);
        else this.toastr.error(r.message || 'Could not load menus');
      },
      error: (e) => this.showLoadError(e, 'menus'),
    });
  }
  newMenu(): void { this.menuForm.set(emptyMenu()); }
  editMenu(m: MenuRow): void { this.menuForm.set({ ...m }); }
  saveMenu(): void {
    const f = this.menuForm();
    if (!f.submodule_no) { this.toastr.warning('Select a submodule.'); return; }
    if (!f.form_id?.trim() || !f.form_name?.trim()) { this.toastr.warning('Form ID and name are required.'); return; }
    this.isSaving.set(true);
    this.data.saveMenu(f).pipe(finalize(() => this.isSaving.set(false))).subscribe({
      next: (r) => {
        if (isSuccess(r)) { this.toastr.success('Menu saved'); this.newMenu(); this.loadMenus(); }
        else this.toastr.error(r.message || 'Save failed');
      },
      error: (e) => this.toastr.error(e?.error?.message || 'API error during save'),
    });
  }
  deleteMenu(no: number): void {
    this.data.deleteMenu(no).subscribe({
      next: (r) => { if (isSuccess(r)) { this.toastr.success('Menu deleted'); this.newMenu(); this.loadMenus(); } else this.toastr.error(r.message || 'Delete failed'); },
      error: (e) => this.toastr.error(e?.error?.message || 'API error during delete'),
    });
  }

  private showLoadError(error: unknown, resource: string): void {
    const e = error as { status?: number; error?: { message?: string } };
    const fallback = e?.status === 403
      ? `You do not have permission to load ${resource}.`
      : `Could not load ${resource}.`;
    this.toastr.error(e?.error?.message || fallback);
  }
}

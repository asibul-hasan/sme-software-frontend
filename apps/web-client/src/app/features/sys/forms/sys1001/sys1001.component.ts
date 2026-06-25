import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysCompanyTypeOptions, sysCountryOptions } from '../../../../core/constants/common-options.constants';
import { Sys1001ModelService } from './services/model.service';
import { Sys1001DataService } from './services/data.service';
import { AuthContextService } from '../../../../core/services/auth-context.service';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule, PageFormLayoutComponent],
  templateUrl: './sys1001.component.html',
  providers: [Sys1001ModelService, Sys1001DataService],
  styles: [`
    .logo-drop-zone {
      border: 2px dashed var(--border-color);
      border-radius: 10px;
      min-height: 140px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--bg-secondary);
      position: relative;
      padding: 16px;
    }
    .logo-drop-zone:hover,
    .logo-drop-zone.drag-over {
      border-color: var(--indigo);
      background: rgba(99, 102, 241, 0.04);
    }
    .logo-drop-zone.drag-over { border-style: solid; }
    .logo-drop-zone input[type="file"] {
      position: absolute; inset: 0; opacity: 0; cursor: pointer; width: 100%; height: 100%;
    }
    .logo-preview-box {
      width: 100%;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background: var(--bg-secondary);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      min-height: 120px;
    }
    .logo-preview-box img {
      max-width: 100%;
      max-height: 160px;
      object-fit: contain;
      padding: 12px;
    }
    .logo-uploading-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
      border-radius: inherit;
    }
    .logo-drop-zone.disabled { pointer-events: none; opacity: 0.6; }
  `],
})
export class Sys1001Component implements OnInit {
  public model          = inject(Sys1001ModelService);
  readonly companyTypeOptions = sysCompanyTypeOptions;
  readonly countryOptions = sysCountryOptions;

  private authContext      = inject(AuthContextService);
  public permissionService = inject(FormPermissionService);

  isDragActive = signal(false);

  ngOnInit(): void {
    this.model.createForm();
    this.permissionService.useLocalPermissions('SYS_1001');
    const companyNo = this.authContext.user()?.company_no;
    if (companyNo) this.model.loadCompany(companyNo);
  }

  onSave(): void { this.model.onSave(); }

  onReset(): void {
    const companyNo = this.model.currentCompanyNo();
    if (companyNo) {
      this.model.loadCompany(companyNo);
    } else {
      this.model.form.reset({ is_active: 1, country_code: 'BD' });
      this.model.clearLogo();
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.model.onLogoSelected(input.files[0]);
      input.value = '';
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(false);
    const file = event.dataTransfer?.files[0];
    if (file) this.model.onLogoSelected(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragActive.set(true);
  }

  onDragLeave(event: DragEvent): void {
    const el = event.currentTarget as HTMLElement;
    if (!el.contains(event.relatedTarget as Node)) {
      this.isDragActive.set(false);
    }
  }
}

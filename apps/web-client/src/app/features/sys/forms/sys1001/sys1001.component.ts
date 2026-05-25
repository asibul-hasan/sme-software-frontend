import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { SharedModule } from '../../../../shared';
import { FormPermissionService } from '../../../../core/services/form-permission.service';
import { sysConstants } from '../../constants/sys.constants';
import { Sys1001ModelService } from './services/model.service';
import { Sys1001DataService } from './services/data.service';
import { AuthContextService } from '../../../../core/services/auth-context.service';
import { LogoUploadComponent } from '../../../../shared/components/logo-upload/logo-upload.component';
import { PageFormLayoutComponent } from '../../../../shared/components/page-form-layout/page-form-layout.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sys1001',
  standalone: true,
  imports: [SharedModule, LogoUploadComponent, PageFormLayoutComponent],
  templateUrl: './sys1001.component.html',
  providers: [Sys1001ModelService, Sys1001DataService],
  styles: [],
})
export class Sys1001Component implements OnInit {
  public model = inject(Sys1001ModelService);
  readonly sysConstants = sysConstants;

  private authContext = inject(AuthContextService);
  public permissionService = inject(FormPermissionService);

  ngOnInit(): void {
    this.model.createForm();
    this.permissionService.useLocalPermissions('SYS_1001');

    const companyNo = this.authContext.user()?.company_no;
    if (companyNo) {
      this.model.loadCompany(companyNo);
    }
  }

  onSave(): void {
    this.model.onSave();
  }

  onReset(): void {
    const companyNo = this.model.currentCompanyNo();
    if (companyNo) {
      this.model.loadCompany(companyNo);
    } else {
      this.model.form.reset({ is_active: 1, country_code: 'BD' });
      this.model.clearLogo();
    }
  }
}

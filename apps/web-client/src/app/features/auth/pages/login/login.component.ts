import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService, ThemeService, LanguageService } from '../../../../core';
import { SharedModule } from '../../../../shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    SharedModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = signal(false);
  showPassword = signal(false);
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    public themeService: ThemeService,
    public languageService: LanguageService
  ) { }

  ngOnInit() {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      remember_me: [false]
    });
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);

    this.authService.login(this.loginForm.value).subscribe({
      next: (response) => {
        this.toastr.success(
          this.languageService.translate('AUTH.LOGIN_SUCCESS'),
          this.languageService.translate('COMMON.SUCCESS')
        );
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastr.error(
          this.languageService.translate('AUTH.LOGIN_ERROR'),
          this.languageService.translate('COMMON.ERROR')
        );
      },
      complete: () => {
        this.isLoading.set(false);
      }
    });
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
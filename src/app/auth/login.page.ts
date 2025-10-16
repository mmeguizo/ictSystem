import { ChangeDetectionStrategy, Component, Injector, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';

type LoginForm = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, NzCardModule, NzFormModule, NzInputModule, NzButtonModule, NzAlertModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrls: ['./login.style.scss'],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  // domain-specific validator: only allow emails ending with @chmsu.edu.ph
  private static chmsuDomainValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value as string) ?? '';
    if (!value) return null;
    const valid = /@chmsu\.edu\.ph$/i.test(value.trim());
    return valid ? null : { chmsuDomain: true };
  }

  readonly form: LoginForm = this.fb.group({
    email: this.fb.control('', { validators: [Validators.required, Validators.email, LoginPage.chmsuDomainValidator] }),
    password: this.fb.control('', { validators: [Validators.required, Validators.minLength(6)] }),
  });

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly loggedIn = signal(false);

  get emailInvalid(): boolean {
    const c = this.form.controls.email;
    return c.touched && c.invalid;
  }

  get passwordInvalid(): boolean {
    const c = this.form.controls.password;
    return c.touched && c.invalid;
  }

  get submitDisabled(): boolean {
    return this.busy() || this.form.invalid;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.busy.set(true);

    // Fake async login to keep logic easy to follow
    setTimeout(() => {
      const { email } = this.form.getRawValue();
      if (email.includes('@')) {
        this.loggedIn.set(true);
        // Optionally navigate somewhere: keep commented for clarity/debugging
       this.router.navigateByUrl('/welcome');
      } else {
        this.error.set('Invalid credentials (demo).');
      }
      this.busy.set(false);
    }, 600);
  }

  // Start Auth0 login redirect flow
  loginWithAuth0(): void {
    // Resolve AuthService only in the browser to avoid SSR DI/initialization
    if (typeof window === 'undefined') return;
    const auth = this.injector.get(AuthService, null);
    auth?.loginWithRedirect();
  }
}

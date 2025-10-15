import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormControl, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';

type LoginForm = FormGroup<{
  email: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './login.page.html',
  styleUrls: ['./login.style.scss'],
})
export class LoginPage {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly router = inject(Router);

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
}

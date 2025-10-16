import { ChangeDetectionStrategy, Component, Injector, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-auth-callback',
  template: `
    <main class="login-container">
      <section class="card">
        @if (!message) {
          <p>Completing sign-in…</p>
        }
        @if (message) {
          <p>{{ message }}</p>
        }
      </section>
    </main>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthCallbackComponent {
  message: string | null = null;
  private readonly injector = inject(Injector);
  private readonly router = inject(Router);

  constructor() {
    // Only in browser: process the redirect callback and navigate
    if (typeof window !== 'undefined') {
      const auth = this.injector.get(AuthService, null);
      // The SDK automatically handles the code/state in the URL when initialized, but calling
      // getAccessTokenSilently will ensure the session is established.
      auth?.isAuthenticated$.subscribe(async () => {
        try {
          // getAccessTokenSilently returns an Observable in Auth0 Angular
          const token = await firstValueFrom(auth.getAccessTokenSilently());
          await this.upsertUserOnBackend(token);
          this.router.navigateByUrl('/welcome');
        } catch (e) {
          console.error('Auth callback error', e);
          this.router.navigateByUrl('/login');
        }
      });
    }
  }

  private async upsertUserOnBackend(token: string): Promise<void> {
    try {
      const res = await fetch('http://localhost:4000/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: 'mutation { upsertMe { created user { id } } }' }),
      });
      if (!res.ok) {
        const text = await res.text();
        console.error('Backend upsert failed:', res.status, text);
        this.message = 'Sign-in failed (backend error)';
        return;
      }
      const json = await res.json();
      console.log('Backend upsert response:', json);
      if (json?.errors) {
        console.error('GraphQL errors:', json.errors);
      }
      const created = json?.data?.upsertMe?.created;
      if (created === true) {
        this.message = 'Account created on first login';
        console.log('Account created on first login');
      } else if (created === false) {
        this.message = 'Welcome back';
        console.log('Welcome back');
      } else {
        this.message = 'Sign-in completed';
      }
    } catch (err) {
      console.error('Backend upsert error', err);
      this.message = 'Sign-in failed (network error)';
    }
  }
}

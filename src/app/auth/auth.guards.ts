import { inject, Injector } from '@angular/core';
import { CanMatchFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { filter, map, take } from 'rxjs';
import { switchMap } from 'rxjs/operators';
function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// If already authenticated and trying to access /login, redirect to /welcome
export const redirectIfAuthenticated: CanMatchFn = () => {
  if (!isBrowser()) return true; // Allow SSR render; client will handle redirect after hydration
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = injector.get(AuthService, null);
  if (!auth) return true;
  return auth.isLoading$.pipe(
    filter((l) => l === false),
    take(1),
    switchMap(() => auth.isAuthenticated$),
    take(1),
    map((isAuth) => (isAuth ? router.createUrlTree(['/welcome']) : true))
  );
};

// Require authentication for protected routes; otherwise redirect to /login
export const authRequired: CanMatchFn = () => {
  if (!isBrowser()) return true; // Allow SSR render; client will handle redirect after hydration
  const injector = inject(Injector);
  const router = inject(Router);
  const auth = injector.get(AuthService, null);
  if (!auth) return router.createUrlTree(['/login']);
  return auth.isLoading$.pipe(
    filter((l) => l === false),
    take(1),
    switchMap(() => auth.isAuthenticated$),
    take(1),
    map((isAuth) => (isAuth ? true : router.createUrlTree(['/login'])))
  );
};

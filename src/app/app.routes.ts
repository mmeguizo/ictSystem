import { Routes } from '@angular/router';

export const routes: Routes = [
  // Top-level login route: renders standalone page without the main layout (no sidebar)
  {
    path: 'login',
    loadComponent: () => import('./auth/login.page').then((m) => m.LoginPage),
  },
  // All other app pages live under the main layout shell
  {
    path: '',
    loadComponent: () => import('./layout/main-layout').then(m => m.MainLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'welcome' },
      { path: 'welcome', loadChildren: () => import('./pages/welcome/welcome.routes').then(m => m.WELCOME_ROUTES) },
      // add other feature routes here as children so they render inside the layout
    ]
  },
];

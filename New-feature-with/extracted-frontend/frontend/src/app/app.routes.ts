import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./shared/components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./shared/components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'subscriber',
    loadComponent: () => import('./portals/subscriber/subscriber-portal.component').then(m => m.SubscriberPortalComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Subscriber'] }
  },
  {
    path: 'agent',
    loadComponent: () => import('./portals/agent/agent-portal.component').then(m => m.AgentPortalComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CSAgent'] }
  },
  {
    path: 'billing',
    loadComponent: () => import('./portals/billing/billing-portal.component').then(m => m.BillingPortalComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Billing'] }
  },
  {
    path: 'networkops',
    loadComponent: () => import('./portals/netops/netops-portal.component').then(m => m.NetopsPortalComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['NetworkOps'] }
  },
  {
    path: 'compliance',
    loadComponent: () => import('./portals/compliance/compliance-portal.component').then(m => m.CompliancePortalComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Compliance'] }
  },
  {
    path: 'admin',
    loadComponent: () => import('./portals/admin/admin-portal.component').then(m => m.AdminPortalComponent),
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Admin'] }
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];

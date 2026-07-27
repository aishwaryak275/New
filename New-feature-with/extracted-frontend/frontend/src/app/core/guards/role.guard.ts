import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const expectedRoles = route.data['roles'] as Array<string>;
  const user = authService.currentUser();
  const userRole = user?.role;

  if (authService.isAuthenticated() && userRole && expectedRoles.includes(userRole)) {
    return true;
  }

  // Redirect to their default landing page if wrong role
  if (authService.isAuthenticated() && userRole) {
    router.navigate([getDefaultPortalRoute(userRole)]);
  } else {
    router.navigate(['/login']);
  }
  return false;
};

export function getDefaultPortalRoute(role: string | undefined): string {
  switch (role) {
    case 'Subscriber': return '/subscriber';
    case 'CSAgent': return '/agent';
    case 'Billing': return '/billing';
    case 'NetworkOps': return '/networkops';
    case 'Compliance': return '/compliance';
    case 'Admin': return '/admin';
    default: return '/login';
  }
}

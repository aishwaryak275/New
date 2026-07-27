import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, switchMap, tap, catchError, of } from 'rxjs';

export interface User {
  id: number;
  name: string;
  role: 'Subscriber' | 'CSAgent' | 'Billing' | 'NetworkOps' | 'Compliance' | 'Admin';
  email: string;
  phone: string;
  regionId: string;
  status: 'Active' | 'Suspended' | 'Inactive';
}

interface LoginResponseDTO {
  token: string;
  role: string;
  name: string;
  mustChangePassword: boolean;
  permissions: string[];
}

interface UserResponseDTO {
  userId: number;
  name: string;
  email: string;
  phone: string;
  roleName: string;
  regionId: number;
  status: string;
}

const ROLE_CODE_MAP: Record<string, User['role']> = {
  S:  'Subscriber',
  CS: 'CSAgent',
  B:  'Billing',
  N:  'NetworkOps',
  C:  'Compliance',
  A:  'Admin'
};

const STATUS_MAP: Record<string, User['status']> = {
  A: 'Active',
  S: 'Suspended',
  I: 'Inactive'
};

function toUser(dto: UserResponseDTO): User {
  return {
    id: dto.userId,
    name: dto.name,
    email: dto.email,
    phone: dto.phone,
    role: ROLE_CODE_MAP[dto.roleName] ?? (dto.roleName as User['role']),
    regionId: dto.regionId != null ? String(dto.regionId) : '',
    status: STATUS_MAP[dto.status] ?? (dto.status as User['status'])
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private authBase = 'http://localhost:9090/teleConnect/iam/api/auth';
  private userBase = 'http://localhost:9090/teleConnect/iam/api/users';

  currentUser = signal<User | null>(null);

  isAuthenticated = computed(() => this.currentUser() !== null);
  userRole = computed(() => this.currentUser()?.role || null);

  constructor(private http: HttpClient, private router: Router) {
    this.loadStoredUser();
  }

  login(email: string, password: string): Observable<User> {
    return this.http.post<LoginResponseDTO>(`${this.authBase}/login`, { email, password }).pipe(
      tap(res => localStorage.setItem('token', res.token)),
      switchMap(() => this.http.get<UserResponseDTO>(`${this.userBase}/me`)),
      map(dto => toUser(dto)),
      tap(user => {
        localStorage.setItem('user', JSON.stringify(user));
        this.currentUser.set(user);
      })
    );
  }

  register(userData: { name: string; email: string; password: string; phone?: string; regionId?: number }): Observable<any> {
    return this.http.post<any>(`${this.authBase}/register`, userData);
  }

  logout(): void {
    // Fire-and-forget audit log; clear session regardless of response
    this.http.post(`${this.authBase}/logout`, {}).pipe(catchError(() => of(null))).subscribe();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put<any>(`${this.authBase}/changePassword`, { currentPassword, newPassword });
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private loadStoredUser(): void {
    const token = this.getToken();
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user: User = JSON.parse(userJson);
        // Normalize any old short-code roles that may be stored (S, CS, B, N, C, A)
        if (ROLE_CODE_MAP[user.role as string]) {
          user.role = ROLE_CODE_MAP[user.role as string];
          localStorage.setItem('user', JSON.stringify(user));
        }
        // Normalize any old short-code statuses (A, S, I)
        if (STATUS_MAP[user.status as string]) {
          user.status = STATUS_MAP[user.status as string];
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.currentUser.set(user);
      } catch {
        this.logout();
      }
    }
  }
}

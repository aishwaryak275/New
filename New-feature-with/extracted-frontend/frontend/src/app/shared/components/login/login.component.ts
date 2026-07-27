import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { getDefaultPortalRoute } from '../../../core/guards/role.guard';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isLoading = false;

  // Demo credentials
  demoUsers = [
    { label: 'Subscriber',         email: 'subscriber@teleconnect.com',  password: 'Password@123', color: 'bg-primary-700 hover:bg-primary-800' },
    { label: 'CS Agent',           email: 'agent@teleconnect.com',        password: 'Password@123', color: 'bg-agent-main hover:bg-agent-dark' },
    { label: 'Billing Exec',       email: 'billing@teleconnect.com',      password: 'Password@123', color: 'bg-billing-main hover:bg-billing-dark' },
    { label: 'Network NOC',        email: 'networkops@teleconnect.com',   password: 'Password@123', color: 'bg-netops-main hover:bg-netops-dark' },
    { label: 'Compliance Officer', email: 'compliance@teleconnect.com',   password: 'Password@123', color: 'bg-compliance-main hover:bg-compliance-dark' },
    { label: 'System Admin',       email: 'admin@teleconnect.com',        password: 'Admin@123',    color: 'bg-admin-main hover:bg-admin-dark' }
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // If already logged in, redirect to respective dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate([getDefaultPortalRoute(this.authService.userRole()!)]);
      return;
    }

    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.toastService.error('Please enter valid email and password.');
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (user) => {
        this.isLoading = false;
        this.toastService.success(`Welcome back, ${user.name}!`);
        this.router.navigate([getDefaultPortalRoute(user.role)]);
      },
      error: (err) => {
        this.isLoading = false;
        const msg = err.error?.message || 'Authentication failed. Please try again.';
        this.toastService.error(msg);
      }
    });
  }

  quickLogin(email: string, password: string): void {
    this.loginForm.patchValue({ email, password });
    this.onSubmit();
  }
}

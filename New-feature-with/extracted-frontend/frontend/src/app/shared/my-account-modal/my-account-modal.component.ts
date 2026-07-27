import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { IamService } from '../../core/services/iam.service';
import { ToastService } from '../../core/services/toast.service';
import { scaleIn } from '../animations';

@Component({
  selector: 'app-my-account-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './my-account-modal.component.html',
  animations: [scaleIn]
})
export class MyAccountModalComponent implements OnInit {
  @Input() userId!: number;
  @Output() closed = new EventEmitter<void>();

  profile: any = null;
  isLoading = true;
  isEditing = false;
  isChangingPassword = false;
  isSavingProfile = false;
  isSavingPassword = false;

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  readonly roleLabels: Record<string, string> = {
    A: 'Admin', S: 'Subscriber', B: 'Billing Executive',
    CS: 'Customer Service Agent', N: 'Network Operations Engineer', C: 'Compliance Officer'
  };

  readonly statusLabels: Record<string, string> = {
    A: 'Active', S: 'Suspended', I: 'Inactive',
    Active: 'Active', Inactive: 'Inactive', Suspended: 'Suspended'
  };

  constructor(
    private authService: AuthService,
    private iamService: IamService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name:  ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]]
    });
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordsMatch });
    this.loadProfile();
  }

  private passwordsMatch(g: FormGroup) {
    return g.get('newPassword')?.value === g.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  loadProfile(): void {
    this.isLoading = true;
    this.iamService.getMe().subscribe({
      next: (data) => {
        this.profile = data;
        this.isLoading = false;
        this.profileForm.patchValue({ name: data.name, phone: data.phone });
      },
      error: () => {
        this.isLoading = false;
        this.toastService.error('Failed to load profile.');
      }
    });
  }

  startEdit(): void {
    this.isEditing = true;
    this.profileForm.patchValue({ name: this.profile.name, phone: this.profile.phone });
  }

  cancelEdit(): void {
    this.isEditing = false;
    this.profileForm.reset({ name: this.profile.name, phone: this.profile.phone });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || !this.userId) return;
    this.isSavingProfile = true;
    this.iamService.updateProfile(this.userId, this.profileForm.value).subscribe({
      next: () => {
        this.iamService.recordAudit('PROFILE_UPDATED', 'IAM');
        this.profile = { ...this.profile, ...this.profileForm.value };
        this.isEditing = false;
        this.isSavingProfile = false;
        this.toastService.success('Profile updated successfully.');
      },
      error: (err: any) => {
        this.isSavingProfile = false;
        this.toastService.error(err.error?.message ?? 'Failed to update profile.');
      }
    });
  }

  openChangePassword(): void {
    this.isChangingPassword = true;
    this.passwordForm.reset();
  }

  closeChangePassword(): void {
    this.isChangingPassword = false;
    this.passwordForm.reset();
  }

  submitChangePassword(): void {
    if (this.passwordForm.invalid) return;
    this.isSavingPassword = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.toastService.success('Password changed successfully.');
        this.closeChangePassword();
      },
      error: (err: any) => {
        this.isSavingPassword = false;
        this.toastService.error(err.error?.message ?? 'Failed to change password.');
      }
    });
  }

  getRoleLabel(role: string): string {
    return this.roleLabels[role] ?? role;
  }

  getStatusLabel(status: string): string {
    return this.statusLabels[status] ?? status;
  }

  close(): void {
    this.closed.emit();
  }
}

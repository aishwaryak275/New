import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Chart } from 'chart.js/auto';
import { AuthService, User } from '../../core/services/auth.service';
import { BillingService } from '../../core/services/billing.service';
import { IamService } from '../../core/services/iam.service';
import { AccountService } from '../../core/services/account.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { fadeInUp, staggerFadeIn, shake, scaleIn } from '../../shared/animations';
import { MyAccountModalComponent } from '../../shared/my-account-modal/my-account-modal.component';

@Component({
  selector: 'app-billing-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MyAccountModalComponent],
  templateUrl: './billing-portal.component.html',
  styleUrls: ['./billing-portal.component.css'],
  animations: [fadeInUp, staggerFadeIn, shake, scaleIn]
})
export class BillingPortalComponent implements OnInit {
  activeTab = signal<string>('runs');
  isSidebarCollapsed = signal<boolean>(false);
  isNotificationOpen = signal<boolean>(false);
  isMyAccountOpen = false;

  // User session
  user!: User;

  // Invoice Run Manager
  pendingRuns: any[] = [
    { cycleId: 2, accountId: 1, name: 'John Subscriber', start: '2026-06-01', end: '2026-07-01', status: 'Pending' },
    { cycleId: 4, accountId: 8, name: 'Michael Green', start: '2026-06-01', end: '2026-07-01', status: 'Pending' },
    { cycleId: 5, accountId: 10, name: 'James Wilson', start: '2026-06-01', end: '2026-07-01', status: 'Pending' }
  ];
  runProgress = 0;
  isRunActive = false;

  // Collection Tracker
  invoices: any[] = [];
  kpiStats = { totalBilled: 0, totalPaid: 0, totalOverdue: 0, efficiency: 100 };
  private collectionsChart: Chart | null = null;

  // Dispute Queue
  disputes: any[] = [];
  activeDispute: any = null;
  resolutionForm!: FormGroup;

  // Late Fee Config
  lateFeeForm!: FormGroup;

  constructor(
    public authService: AuthService,
    private billingService: BillingService,
    private accountService: AccountService,
    private iamService: IamService,
    public notificationService: NotificationService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {
    // Render collections bar chart when tab changes to tracker
    effect(() => {
      if (this.activeTab() === 'tracker') {
        setTimeout(() => this.renderTrackerChart(), 100);
      }
    });
  }

  ngOnInit(): void {
    this.user = this.authService.currentUser()!;
    this.initForms();
    this.loadInvoices();
    this.loadDisputes();
    this.loadSystemConfig();
  }

  initForms(): void {
    this.resolutionForm = this.fb.group({
      status: ['Resolved', Validators.required],
      remarks: ['', [Validators.required, Validators.minLength(5)]]
    });

    this.lateFeeForm = this.fb.group({
      excessDataRateMb: [0.05, Validators.required],
      excessVoiceRateMin: [0.10, Validators.required],
      excessSmsRateCount: [0.02, Validators.required],
      taxPercentage: [15.00, Validators.required],
      lateFeeFlat: [5.00, Validators.required],
      lateFeePercentage: [1.5, Validators.required],
      lateFeeGraceDays: [5, Validators.required],
      autoSuspendDays: [15, Validators.required],
      alertThreshold80: [true],
      alertThreshold100: [true]
    });
  }

  loadInvoices(): void {
    this.billingService.getInvoices().subscribe({
      next: (data) => {
        this.invoices = data;
        this.calculateKpis();
      },
      error: () => this.toastService.error('Failed to load collections invoices.')
    });
  }

  loadDisputes(): void {
    this.billingService.getDisputes().subscribe(data => {
      this.disputes = data;
    });
  }

  loadSystemConfig(): void {
    this.billingService.getSystemConfig().subscribe({
      next: (config) => {
        this.lateFeeForm.patchValue(config);
      },
      error: () => this.toastService.error('Failed to load system config details.')
    });
  }

  calculateKpis(): void {
    let billed = 0;
    let paid = 0;
    let overdue = 0;

    for (let inv of this.invoices) {
      billed += inv.totalAmount;
      if (inv.status === 'Paid') {
        paid += inv.totalAmount;
      } else if (inv.status === 'Overdue') {
        overdue += inv.totalAmount;
      }
    }

    this.kpiStats.totalBilled = Math.round(billed);
    this.kpiStats.totalPaid = Math.round(paid);
    this.kpiStats.totalOverdue = Math.round(overdue);
    this.kpiStats.efficiency = billed > 0 ? Math.round((paid / billed) * 100) : 100;
  }

  // ==========================================
  // Layout Controls
  // ==========================================
  setTab(tab: string): void {
    this.activeTab.set(tab);
    this.isNotificationOpen.set(false);
  }

  toggleSidebar(): void {
    this.isSidebarCollapsed.set(!this.isSidebarCollapsed());
  }

  toggleNotifications(): void {
    this.isNotificationOpen.set(!this.isNotificationOpen());
    if (this.isNotificationOpen()) {
      this.notificationService.refreshNotifications();
    }
  }

  logout(): void {
    this.authService.logout();
  }

  // ==========================================
  // Invoice Run Manager
  // ==========================================
  triggerInvoiceRun(): void {
    if (this.pendingRuns.length === 0) {
      this.toastService.success('All open billing cycles have been invoiced.');
      return;
    }
    
    this.isRunActive = true;
    this.runProgress = 0;

    const processRun = (index: number) => {
      if (index >= this.pendingRuns.length) {
        setTimeout(() => {
          this.isRunActive = false;
          this.pendingRuns = [];
          this.toastService.success('Invoice batch run completed.');
          this.loadInvoices();
        }, 500);
        return;
      }

      const run = this.pendingRuns[index];
      this.billingService.triggerBillingRun(run.cycleId, run.accountId).subscribe({
        next: () => {
          run.status = 'Completed';
          this.runProgress = Math.round(((index + 1) / this.pendingRuns.length) * 100);
          setTimeout(() => processRun(index + 1), 600); // delay for animation feel
        },
        error: () => {
          run.status = 'Failed';
          this.toastService.error(`Failed run for Account #${run.accountId}`);
          this.isRunActive = false;
        }
      });
    };

    processRun(0);
  }

  // ==========================================
  // Simulated Collection Payments
  // ==========================================
  collectPayment(id: number): void {
    this.billingService.payInvoice(id, { amountPaid: 0, paymentMethod: 'Manual' }).subscribe({
      next: () => {
        this.toastService.success(`Payment recorded for Invoice #${id}.`);
        this.loadInvoices();
      },
      error: () => this.toastService.error('Failed to log payment collection.')
    });
  }

  // ==========================================
  // Dispute Resolution
  // ==========================================
  openDisputeResolution(dispute: any): void {
    this.activeDispute = dispute;
    this.resolutionForm.reset({ status: 'Resolved' });
  }

  submitResolution(): void {
    if (this.resolutionForm.invalid || !this.activeDispute) return;

    const { status, remarks } = this.resolutionForm.value;
    this.billingService.resolveDispute(this.activeDispute.id, status, remarks).subscribe({
      next: () => {
        this.iamService.recordAudit('DISPUTE_RESOLVED', 'BILLING');
        this.toastService.success(`Dispute decision updated successfully.`);
        this.activeDispute = null;
        this.loadDisputes();
        this.loadInvoices();
      },
      error: () => this.toastService.error('Failed to resolve dispute.')
    });
  }

  // ==========================================
  // Config Management & Late Fee Application
  // ==========================================
  saveConfig(): void {
    if (this.lateFeeForm.invalid) return;

    this.billingService.updateSystemConfig(this.lateFeeForm.value).subscribe({
      next: () => {
        this.iamService.recordAudit('BILLING_CONFIG_UPDATED', 'BILLING');
        this.toastService.success('Tariff rates and late fees updated in DB.');
      },
      error: () => this.toastService.error('Failed to update config settings.')
    });
  }

  runLateFeeJob(): void {
    this.billingService.applyLateFees().subscribe({
      next: () => {
        this.toastService.success('Late fees calculated and applied to overdue invoices.');
        this.loadInvoices();
      },
      error: () => this.toastService.error('Error applying late fees.')
    });
  }

  // ==========================================
  // Chart Rendering
  // ==========================================
  renderTrackerChart(): void {
    const ctx = document.getElementById('collectionsChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.collectionsChart) {
      this.collectionsChart.destroy();
    }

    this.collectionsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['0-30 Days', '31-60 Days', '61-90 Days', '90+ Days'],
        datasets: [
          {
            label: 'Outstanding Balance ($)',
            data: [
              this.kpiStats.totalOverdue > 0 ? this.kpiStats.totalOverdue * 0.5 : 2300,
              this.kpiStats.totalOverdue > 0 ? this.kpiStats.totalOverdue * 0.3 : 1200,
              this.kpiStats.totalOverdue > 0 ? this.kpiStats.totalOverdue * 0.15 : 600,
              this.kpiStats.totalOverdue > 0 ? this.kpiStats.totalOverdue * 0.05 : 200
            ],
            backgroundColor: '#059669', // billing emerald
            borderRadius: 8,
            borderWidth: 0
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f1f5f9' }, beginAtZero: true }
        }
      }
    });
  }
}

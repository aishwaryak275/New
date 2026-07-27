import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { AccountService } from '../../core/services/account.service';
import { IamService } from '../../core/services/iam.service';
import { PlanService } from '../../core/services/plan.service';
import { BillingService } from '../../core/services/billing.service';
import { TicketService } from '../../core/services/ticket.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { fadeInUp, staggerFadeIn, shake, scaleIn, slideHorizontal } from '../../shared/animations';
import { MyAccountModalComponent } from '../../shared/my-account-modal/my-account-modal.component';

@Component({
  selector: 'app-agent-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, MyAccountModalComponent],
  templateUrl: './agent-portal.component.html',
  styleUrls: ['./agent-portal.component.css'],
  animations: [fadeInUp, staggerFadeIn, shake, scaleIn, slideHorizontal]
})
export class AgentPortalComponent implements OnInit {
  activeTab = signal<string>('search');
  isSidebarCollapsed = signal<boolean>(false);
  isNotificationOpen = signal<boolean>(false);
  isMyAccountOpen = false;

  // User session
  user!: User;

  // Search Screen
  searchQuery = '';
  searchResults: any[] = [];
  selectedAccount360: any = null;
  isSearching = false;

  /** True when the selected account already has at least one Active SIM line. */
  get hasActiveLine(): boolean {
    return !!this.selectedAccount360?.lines?.some((l: any) => l?.status === 'Active');
  }

  // Request Handler Queue
  requestsQueue: any[] = [];
  filterStatus = 'All';

  // Fault Ticket Form
  faultForm!: FormGroup;
  isSubmittingFault = false;

  // User Directory
  iamUsers: any[] = [];
  userPage = 0;
  readonly userPageSize = 10;
  searchName = '';
  searchEmail = '';
  searchPhone = '';
  searchRole = '';
  searchStatus = '';

  // Register New User Modal
  showRegisterModal = false;
  registerForm!: FormGroup;
  isRegisteringUser = false;

  // Create Subscriber Account & Add SIM Modals
  showCreateAccountModal = false;
  selectedSubscriberUser: any = null;
  createAccountForm!: FormGroup;
  isCreatingAccount = false;

  showAccountCreatedSuccessModal = false;
  createdAccountId: number | null = null;

  showAddSimModal = false;
  simForm!: FormGroup;
  isActivatingSim = false;

  // Plan Change Wizard
  wizardStep = signal<number>(1); // 1: Select Line, 2: Compare Plans, 3: Select Date, 4: Confirm
  wizardForm!: FormGroup;
  availablePlans: any[] = [];
  selectedWizardLine: any = null;
  selectedWizardPlan: any = null;

  constructor(
    public authService: AuthService,
    private accountService: AccountService,
    private iamService: IamService,
    private planService: PlanService,
    private billingService: BillingService,
    private ticketService: TicketService,
    public notificationService: NotificationService,
    private toastService: ToastService,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser()!;
    this.initForms();
    this.loadRequests();
    this.loadPlans();
  }

  initForms(): void {
    this.faultForm = this.fb.group({
      accountId: ['', Validators.required],
      lineId: [''],
      faultType: ['NoCoverage', Validators.required],
      priority: ['Medium', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });

    this.wizardForm = this.fb.group({
      effectiveDate: ['', Validators.required]
    });

    this.registerForm = this.fb.group({
      name:     ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      phone:    ['', Validators.pattern('^[0-9]{10}$')],
      regionId: [null]
    });

    this.createAccountForm = this.fb.group({
      accountType: ['Prepaid', Validators.required],
      kycStatus:   ['Pending', Validators.required]
    });

    this.simForm = this.fb.group({
      msisdn:      [{ value: '', disabled: true }, Validators.required],
      serviceType: ['VoiceData', Validators.required],
      iccid:       ['', [Validators.required, Validators.maxLength(22)]]
    });
  }

  loadRequests(): void {
    this.ticketService.getRequests().subscribe({
      next: (data) => this.requestsQueue = data,
      error: () => this.toastService.error('Failed to load service requests queue.')
    });
  }

  loadPlans(): void {
    this.planService.getPlans(true).subscribe(data => {
      this.availablePlans = data;
    });
  }

  // ==========================================
  // Layout Handlers
  // ==========================================
  setTab(tab: string): void {
    this.activeTab.set(tab);
    this.isNotificationOpen.set(false);
    if (tab === 'users') this.loadIamUsers();
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

  // ── Register New User Modal ────────────────────────────────────────────────
  openRegisterModal(): void {
    this.registerForm.reset();
    this.showRegisterModal = true;
  }

  closeRegisterModal(): void {
    this.showRegisterModal = false;
    this.registerForm.reset();
  }

  submitRegisterUser(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields correctly.');
      return;
    }
    this.isRegisteringUser = true;
    const { name, email, password, phone, regionId } = this.registerForm.value;
    this.authService.register({
      name,
      email,
      password,
      phone: phone || undefined,
      regionId: regionId ? Number(regionId) : undefined
    }).subscribe({
      next: () => {
        this.isRegisteringUser = false;
        this.iamService.recordAudit('USER_REGISTERED', 'IAM');
        this.toastService.success(`Subscriber "${name}" registered successfully.`);
        this.closeRegisterModal();
        this.loadIamUsers();
      },
      error: (err) => {
        this.isRegisteringUser = false;
        const msg = err?.error?.message || 'Registration failed. Email or phone number may already be in use.';
        this.toastService.error(msg);
      }
    });
  }

  // ── User Directory ─────────────────────────────────────────────────────────
  loadIamUsers(): void {
    this.userPage = 0;
    this.iamService.searchUsers({}).subscribe({
      next: (users) => { this.iamUsers = users; this.enrichUsersWithAccountStatus(); },
      error: () => this.toastService.error('Failed to load users.')
    });
  }

  private enrichUsersWithAccountStatus(): void {
    this.accountService.getAllAccounts().subscribe({
      next: (accounts) => {
        const activeIds = new Set<number>(
          accounts.filter((a: any) => a.status === 'Active').map((a: any) => Number(a.subscriberId))
        );
        this.iamUsers = this.iamUsers.map((u: any) => ({
          ...u,
          hasActiveAccount: activeIds.has(Number(u.userId))
        }));
      },
      error: () => {}
    });
  }

  searchUsers(): void {
    this.userPage = 0;
    this.iamService.searchUsers({
      name: this.searchName || undefined,
      email: this.searchEmail || undefined,
      phone: this.searchPhone || undefined,
      role: this.searchRole || undefined,
      status: this.searchStatus || undefined
    }).subscribe({
      next: (users) => { this.iamUsers = users; this.enrichUsersWithAccountStatus(); },
      error: () => this.toastService.error('User search failed.')
    });
  }

  clearUserSearch(): void {
    this.searchName = ''; this.searchEmail = ''; this.searchPhone = '';
    this.searchRole = ''; this.searchStatus = '';
    this.userPage = 0;
    this.loadIamUsers();
  }

  get paginatedUsers(): any[] {
    const start = this.userPage * this.userPageSize;
    return this.iamUsers.slice(start, start + this.userPageSize);
  }

  get userTotalPages(): number {
    return Math.ceil(this.iamUsers.length / this.userPageSize);
  }

  userNextPage(): void { if (this.userPage < this.userTotalPages - 1) this.userPage++; }
  userPrevPage(): void { if (this.userPage > 0) this.userPage--; }

  getRoleBadgeClasses(role: string): string {
    const map: Record<string, string> = {
      A: 'bg-rose-600', CS: 'bg-blue-600', B: 'bg-amber-600',
      N: 'bg-emerald-600', C: 'bg-purple-600', S: 'bg-slate-500'
    };
    return `${map[role] ?? 'bg-slate-500'} text-white text-[10px] font-bold w-7 h-7 rounded-full flex items-center justify-center`;
  }

  getStatusBadgeClasses(status: string): string {
    const map: Record<string, string> = {
      A: 'bg-emerald-100 text-emerald-700', S: 'bg-amber-100 text-amber-700', I: 'bg-rose-100 text-rose-700'
    };
    return `${map[status] ?? 'bg-slate-100 text-slate-600'} px-2.5 py-0.5 rounded-full text-xs font-semibold`;
  }

  getStatusLabel(status: string): string {
    return ({ A: 'Active', S: 'Suspended', I: 'Inactive' } as Record<string, string>)[status] ?? status;
  }

  getRoleLabel(role: string): string {
    return ({ A: 'Admin', CS: 'Customer Service Agent', B: 'Billing Executive', N: 'Network Operations Engineer', C: 'Compliance Officer', S: 'Subscriber' } as Record<string, string>)[role] ?? role;
  }

  // Replace SIM Modal
  showReplaceSimModal = false;
  selectedLineForReplace: any = null;
  replaceIccid = '';
  isReplacingSim = false;

  // Service Type Modal
  showServiceTypeModal = false;
  selectedLineForServiceType: any = null;
  newServiceType = 'VoiceData';
  isUpdatingServiceType = false;

  // MSISDN Lookup
  msisdnLookupQuery = '';
  isLookingUpMsisdn = false;

  // ==========================================
  // Account Search & 360 View
  // ==========================================
  onSearch(): void {
    const query = this.searchQuery.trim();
    if (!query) {
      this.toastService.error('Please enter a search query.');
      return;
    }
    // Detect MSISDN: starts with + and digits, or 10-15 pure digits
    const isMsisdn = /^\+\d{8,15}$/.test(query) || /^\d{10,15}$/.test(query);
    if (isMsisdn) {
      this.isSearching = true;
      this.accountService.lookupByMsisdn(query).subscribe({
        next: (line) => {
          this.isSearching = false;
          this.searchResults = [];
          if (line?.accountId) {
            this.selectAccount(line.accountId);
          } else {
            this.toastService.error('No subscriber found for that phone number.');
          }
        },
        error: () => {
          this.iamService.searchUsers({ phone: query }).subscribe({
            next: (users) => {
              const sub = users.find((u: any) => u.roleName === 'S' || u.roleName === 'Subscriber');
              if (sub) {
                this.accountService.getAccountsBySubscriberId(sub.userId).subscribe({
                  next: (accounts) => {
                    this.isSearching = false;
                    this.searchResults = [];
                    if (accounts?.length > 0) { this.selectAccount(accounts[0].accountId); }
                    else { this.toastService.error('No subscriber account found for that phone number.'); }
                  },
                  error: () => { this.isSearching = false; this.toastService.error('No subscriber found for that phone number.'); }
                });
              } else {
                this.isSearching = false;
                this.toastService.error('No subscriber found for that phone number.');
              }
            },
            error: () => { this.isSearching = false; this.toastService.error('No subscriber found for that phone number.'); }
          });
        }
      });
      return;
    }
    // Pure integer (1-9 digits) → try Account ID first, then Line ID
    const isId = /^\d{1,9}$/.test(query);
    if (isId) {
      const id = parseInt(query, 10);
      this.isSearching = true;
      this.accountService.getAccount360(id).subscribe({
        next: (account) => {
          this.isSearching = false;
          this.searchResults = [];
          if (account?.accountId) {
            this.selectAccount(account.accountId);
          } else {
            this.toastService.error('No account found for that ID.');
          }
        },
        error: () => {
          // Account ID not found — try as Line ID
          this.accountService.lookupByLineId(id).subscribe({
            next: (line) => {
              this.isSearching = false;
              this.searchResults = [];
              if (line?.accountId) {
                this.selectAccount(line.accountId);
              } else {
                this.toastService.error('No subscriber found for that ID.');
              }
            },
            error: () => {
              this.isSearching = false;
              this.toastService.error('No account or SIM line found for that ID.');
            }
          });
        }
      });
      return;
    }
    this.isSearching = true;
    this.accountService.searchAccounts(query).subscribe({
      next: (data) => {
        this.searchResults = data;
        this.isSearching = false;
        this.selectedAccount360 = null;
        if (data.length === 0) {
          this.toastService.success('No records found.');
        }
      },
      error: () => {
        this.isSearching = false;
        this.toastService.error('Account lookup failed.');
      }
    });
  }

  lookupMsisdn(): void {
    if (!this.msisdnLookupQuery.trim()) {
      this.toastService.error('Please enter MSISDN / mobile number.');
      return;
    }
    this.isLookingUpMsisdn = true;
    this.accountService.lookupByMsisdn(this.msisdnLookupQuery.trim()).subscribe({
      next: (line) => {
        this.isLookingUpMsisdn = false;
        if (line && line.accountId) {
          this.toastService.success(`Found SIM line for MSISDN ${line.msisdn} on Account #${line.accountId}.`);
          this.selectAccount(line.accountId);
        } else {
          this.toastService.error('No SIM line found matching MSISDN.');
        }
      },
      error: () => {
        this.isLookingUpMsisdn = false;
        this.toastService.error('MSISDN lookup failed.');
      }
    });
  }

  selectAccount(id: number): void {
    this.accountService.getAccount360(id).subscribe({
      next: (account) => {
        this.accountService.getSimLines(id).subscribe({
          next: (lines) => {
            this.iamService.getUser(account.subscriberId).subscribe({
              next: (user) => {
                this.selectedAccount360 = { ...account, subscriber: user, lines, tickets: [] };
                this.faultForm.patchValue({
                  accountId: account.accountId,
                  lineId: lines?.[0]?.lineId || ''
                });
              },
              error: () => {
                this.selectedAccount360 = { ...account, subscriber: null, lines, tickets: [] };
                this.faultForm.patchValue({ accountId: account.accountId });
              }
            });
          },
          error: () => {
            this.selectedAccount360 = { ...account, subscriber: null, lines: [], tickets: [] };
            this.faultForm.patchValue({ accountId: account.accountId });
          }
        });
      },
      error: () => this.toastService.error('Failed to load 360-degree profile details.')
    });
  }

  updateAccountStatus(accountId: number, status: string): void {
    this.accountService.updateAccountStatus(accountId, status).subscribe({
      next: () => {
        this.iamService.recordAudit('ACCOUNT_STATUS_UPDATED', 'SUBSCRIBER');
        this.toastService.success(`Account #${accountId} status updated to ${status}.`);
        if (this.selectedAccount360?.accountId === accountId) {
          this.selectAccount(accountId);
        }
      },
      error: () => this.toastService.error('Failed to update account status.')
    });
  }

  updateAccountKyc(accountId: number, kycStatus: string): void {
    this.accountService.updateKycStatus(accountId, kycStatus).subscribe({
      next: () => {
        this.iamService.recordAudit('ACCOUNT_KYC_UPDATED', 'SUBSCRIBER');
        this.toastService.success(`Account #${accountId} KYC status updated to ${kycStatus}.`);
        if (this.selectedAccount360?.accountId === accountId) {
          this.selectAccount(accountId);
        }
      },
      error: () => this.toastService.error('Failed to update KYC status.')
    });
  }

  updateSimStatus(accountId: number, lineId: number, newStatus: string): void {
    this.accountService.updateSimStatus(accountId, lineId, newStatus).subscribe({
      next: () => {
        this.iamService.recordAudit('SIM_STATUS_UPDATED', 'SUBSCRIBER');
        this.toastService.success(`SIM Line #${lineId} status updated to ${newStatus}.`);
        if (this.selectedAccount360?.accountId === accountId) {
          this.selectAccount(accountId);
        }
      },
      error: () => this.toastService.error('Failed to update SIM line status.')
    });
  }

  openReplaceSimModal(line: any): void {
    this.selectedLineForReplace = line;
    this.replaceIccid = '';
    this.showReplaceSimModal = true;
  }

  closeReplaceSimModal(): void {
    this.showReplaceSimModal = false;
    this.selectedLineForReplace = null;
  }

  submitReplaceSim(): void {
    if (!this.selectedLineForReplace || !this.replaceIccid.trim() || !this.selectedAccount360) return;
    this.isReplacingSim = true;
    const accountId = this.selectedAccount360.accountId;
    const lineId = this.selectedLineForReplace.lineId;

    this.accountService.replaceSim(accountId, lineId, this.replaceIccid.trim()).subscribe({
      next: () => {
        this.isReplacingSim = false;
        this.iamService.recordAudit('SIM_REPLACED', 'SUBSCRIBER');
        this.toastService.success(`SIM line #${lineId} chip replaced successfully.`);
        this.closeReplaceSimModal();
        this.selectAccount(accountId);
      },
      error: (err) => {
        this.isReplacingSim = false;
        this.toastService.error(err.error?.message ?? 'Failed to replace SIM line chip.');
      }
    });
  }

  openChangeServiceTypeModal(line: any): void {
    this.selectedLineForServiceType = line;
    this.newServiceType = line.serviceType || 'VoiceData';
    this.showServiceTypeModal = true;
  }

  closeChangeServiceTypeModal(): void {
    this.showServiceTypeModal = false;
    this.selectedLineForServiceType = null;
  }

  submitChangeServiceType(): void {
    if (!this.selectedLineForServiceType || !this.selectedAccount360) return;
    this.isUpdatingServiceType = true;
    const accountId = this.selectedAccount360.accountId;
    const lineId = this.selectedLineForServiceType.lineId;

    this.accountService.updateServiceType(accountId, lineId, this.newServiceType).subscribe({
      next: () => {
        this.isUpdatingServiceType = false;
        this.iamService.recordAudit('SIM_SERVICE_TYPE_UPDATED', 'SUBSCRIBER');
        this.toastService.success(`SIM line #${lineId} service type updated to ${this.newServiceType}.`);
        this.closeChangeServiceTypeModal();
        this.selectAccount(accountId);
      },
      error: (err) => {
        this.isUpdatingServiceType = false;
        this.toastService.error(err.error?.message ?? 'Failed to update service type.');
      }
    });
  }

  // Masking helper
  maskMsisdn(msisdn: string): string {
    if (!msisdn) return '';
    return msisdn.substring(0, 2) + 'XXXXXX' + msisdn.substring(msisdn.length - 2);
  }

  // ==========================================
  // Service Request Handler
  // ==========================================
  getFilteredRequests(): any[] {
    if (this.filterStatus === 'All') return this.requestsQueue;
    return this.requestsQueue.filter(r => r.status === this.filterStatus);
  }

  approvingRequestId: number | null = null;

  updateRequest(id: number, status: string): void {
    this.ticketService.updateRequestStatus(id, status).subscribe({
      next: () => {
        this.toastService.success(`Request #${id} status updated to ${status}.`);
        this.loadRequests();
      },
      error: () => this.toastService.error('Failed to update service request status.')
    });
  }

  approveConnectionRequest(requestId: number): void {
    this.approvingRequestId = requestId;
    this.ticketService.approveConnection(requestId).subscribe({
      next: (res) => {
        this.approvingRequestId = null;
        this.toastService.success(res?.message || `Request #${requestId} connection approved and provisioned successfully.`);
        this.loadRequests();
      },
      error: (err) => {
        this.approvingRequestId = null;
        const msg = err?.error?.message || err?.message || 'Connection approval failed during provisioning.';
        this.toastService.error(msg);
      }
    });
  }

  rejectConnectionRequest(requestId: number): void {
    const reason = prompt('Please enter rejection reason:', 'Document / KYC verification failed');
    if (reason === null) return;
    this.ticketService.updateRequestStatus(requestId, 'X').subscribe({
      next: () => {
        this.toastService.success(`Request #${requestId} rejected.`);
        this.loadRequests();
      },
      error: () => this.toastService.error('Failed to reject connection request.')
    });
  }

  // ==========================================
  // Fault Ticket Creation
  // ==========================================
  submitFaultTicket(): void {
    if (this.faultForm.invalid) {
      this.toastService.error('Please fill in all mandatory fault parameters.');
      return;
    }
    this.isSubmittingFault = true;
    this.ticketService.createFaultTicket(this.faultForm.value).subscribe({
      next: () => {
        this.isSubmittingFault = false;
        this.toastService.success('Fault ticket raised and assigned to NOC.');
        this.faultForm.reset({ faultType: 'NoCoverage', priority: 'Medium' });
      },
      error: () => {
        this.isSubmittingFault = false;
        this.toastService.error('Failed to create fault ticket.');
      }
    });
  }

  // ==========================================
  // Plan Change Wizard Logic
  // ==========================================
  startWizardFlow(line: any): void {
    this.selectedWizardLine = line;
    this.wizardStep.set(1);
    this.setTab('wizard');
  }

  nextWizardStep(): void {
    const step = this.wizardStep();
    if (step === 1) {
      if (!this.selectedWizardLine) {
        this.toastService.error('Please select a line.');
        return;
      }
      this.wizardStep.set(2);
    } else if (step === 2) {
      if (!this.selectedWizardPlan) {
        this.toastService.error('Please compare and select a target plan.');
        return;
      }
      this.wizardStep.set(3);
    } else if (step === 3) {
      if (this.wizardForm.invalid) {
        this.toastService.error('Please choose a valid activation date.');
        return;
      }
      this.wizardStep.set(4);
    }
  }

  prevWizardStep(): void {
    const step = this.wizardStep();
    if (step > 1) {
      this.wizardStep.set(step - 1);
    }
  }

  selectWizardPlan(plan: any): void {
    this.selectedWizardPlan = plan;
  }

  confirmWizardChange(): void {
    if (!this.selectedWizardLine || !this.selectedWizardPlan) return;

    const plan = this.selectedWizardPlan;
    const planId: number = plan.planId ?? plan.id;
    const lineId: number = this.selectedWizardLine.lineId;
    const accountId: number =
      this.selectedWizardLine.accountId ?? this.selectedAccount360?.accountId;

    const activationDate: string = this.wizardForm.value.effectiveDate;
    const validityDays: number = plan.validityDays ?? 28;
    const expiryDate = this.addDaysToDate(activationDate, validityDays);
    const planPrice: number = plan.planPrice ?? 0;
    const taxes = Math.round(planPrice * 0.18 * 100) / 100;

    this.planService.createSubscription({
      lineId, planId, activationDate, expiryDate, renewalType: 'AutoRenew', status: 'A'
    }).subscribe({
      next: () => {
        this.toastService.success(`Plan upgraded successfully to ${plan.name}!`);
        // Bill the plan: create a billing cycle + invoice carrying the plan price so
        // it appears in the subscriber's invoices and the Billing Executive queue.
        if (accountId) {
          this.autoCreateInvoice(accountId, planPrice, taxes, activationDate, expiryDate);
        } else {
          this.toastService.error('Invoice not created: account ID could not be resolved for this line.');
        }
        this.resetWizard();
        this.setTab('search');
        if (this.selectedAccount360?.accountId) {
          this.selectAccount(this.selectedAccount360.accountId); // reload
        }
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? `HTTP ${err?.status ?? 'error'}`;
        this.toastService.error('Failed to activate plan change: ' + msg);
      }
    });
  }

  private addDaysToDate(dateStr: string, days: number): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  /** Creates a billing cycle then a plan-charge invoice for the given account. */
  private autoCreateInvoice(
    accountId: number,
    planPrice: number,
    taxes: number,
    cycleStart: string,
    cycleEnd: string
  ): void {
    this.billingService.createBillingCycle(accountId, cycleStart, cycleEnd).subscribe({
      next: (cycle: any) => {
        const cycleId: number = cycle?.cycleId ?? cycle?.id;
        if (!cycleId) {
          this.toastService.error('Invoice not created: billing cycle ID missing.');
          return;
        }
        this.billingService.generateInvoice({
          accountId,
          cycleId,
          planCharges: planPrice,
          excessCharges: 0,
          addOnCharges: 0,
          taxes
        }).subscribe({
          next: () => this.toastService.success('Invoice generated and sent to the Billing Executive queue.'),
          error: (err: any) => {
            const msg = err?.error?.message ?? `HTTP ${err?.status ?? 'error'}`;
            this.toastService.error('Invoice generation failed: ' + msg);
          }
        });
      },
      error: (err: any) => {
        const msg = err?.error?.message ?? `HTTP ${err?.status ?? 'error'}`;
        this.toastService.error('Billing cycle creation failed: ' + msg);
      }
    });
  }

  resetWizard(): void {
    this.wizardStep.set(1);
    this.selectedWizardLine = null;
    this.selectedWizardPlan = null;
    this.wizardForm.reset();
  }

  // ── Create Account & SIM Line Modal Handlers ──────────────────────────────
  openCreateAccountModal(u: any): void {
    this.selectedSubscriberUser = u;
    this.createAccountForm.reset({
      accountType: 'Prepaid',
      kycStatus: 'Pending'
    });
    this.showCreateAccountModal = true;
  }

  closeCreateAccountModal(): void {
    this.showCreateAccountModal = false;
  }

  submitCreateAccount(): void {
    if (this.createAccountForm.invalid || !this.selectedSubscriberUser) return;
    this.isCreatingAccount = true;
    const payload = {
      subscriberId: this.selectedSubscriberUser.userId,
      accountType: this.createAccountForm.value.accountType,
      kycStatus: this.createAccountForm.value.kycStatus
    };

    this.accountService.createAccount(payload).subscribe({
      next: (res) => {
        this.isCreatingAccount = false;
        this.closeCreateAccountModal();
        this.createdAccountId = res?.accountId ?? res?.id ?? null;
        this.showAccountCreatedSuccessModal = true;
        this.iamService.recordAudit('SUBSCRIBER_ACCOUNT_CREATED', 'SUBSCRIBER');
        this.enrichUsersWithAccountStatus();
        this.toastService.success('Subscriber account created successfully.');
      },
      error: (err) => {
        this.isCreatingAccount = false;
        this.toastService.error(err.error?.message ?? 'Failed to create subscriber account.');
      }
    });
  }

  closeSuccessModal(): void {
    this.showAccountCreatedSuccessModal = false;
  }

  openAddSimModalFromSuccess(): void {
    this.showAccountCreatedSuccessModal = false;
    this.simForm.patchValue({
      msisdn: this.selectedSubscriberUser?.phone || '',
      serviceType: 'VoiceData',
      iccid: ''
    });
    this.showAddSimModal = true;
  }

  openAddSimModalFrom360(): void {
    this.createdAccountId = this.selectedAccount360.accountId;
    this.simForm.patchValue({
      msisdn: this.selectedAccount360.subscriber?.phone || '',
      serviceType: 'VoiceData',
      iccid: ''
    });
    this.showAddSimModal = true;
  }

  closeAddSimModal(): void {
    this.showAddSimModal = false;
  }

  submitAddSimLine(): void {
    if (this.simForm.invalid || !this.createdAccountId) return;
    this.isActivatingSim = true;
    const payload = {
      msisdn: this.simForm.getRawValue().msisdn || '',
      serviceType: this.simForm.value.serviceType,
      iccid: this.simForm.value.iccid
    };

    this.accountService.addLine(this.createdAccountId, payload).subscribe({
      next: () => {
        this.isActivatingSim = false;
        this.iamService.recordAudit('SIM_LINE_ACTIVATED', 'SUBSCRIBER');
        this.toastService.success(`SIM line activated successfully for Account #${this.createdAccountId}.`);
        this.closeAddSimModal();
        if (this.selectedAccount360) {
          this.selectAccount(this.selectedAccount360.accountId);
        } else if (this.activeTab() === 'users') {
          this.loadIamUsers();
        }
      },
      error: (err) => {
        this.isActivatingSim = false;
        this.toastService.error(err.error?.message ?? 'Failed to activate SIM line.');
      }
    });
  }
}

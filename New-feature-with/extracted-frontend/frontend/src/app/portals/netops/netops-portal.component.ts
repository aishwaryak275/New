import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, User } from '../../core/services/auth.service';
import { IamService } from '../../core/services/iam.service';
import { PlanService } from '../../core/services/plan.service';
import { TicketService } from '../../core/services/ticket.service';
import { AccountService } from '../../core/services/account.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';
import { fadeInUp, staggerFadeIn, shake, scaleIn } from '../../shared/animations';
import { MyAccountModalComponent } from '../../shared/my-account-modal/my-account-modal.component';

@Component({
  selector: 'app-netops-portal',
  standalone: true,
  imports: [CommonModule, FormsModule, MyAccountModalComponent],
  templateUrl: './netops-portal.component.html',
  styleUrls: ['./netops-portal.component.css'],
  animations: [fadeInUp, staggerFadeIn, shake, scaleIn]
})
export class NetopsPortalComponent implements OnInit, OnDestroy {
  activeTab = signal<string>('kanban');
  isSidebarCollapsed = signal<boolean>(false);
  isNotificationOpen = signal<boolean>(false);
  isMyAccountOpen = false;

  // User details
  user!: User;
  staffMembers: any[] = [];

  // Fault Tickets Kanban Board
  allTickets: any[] = [];
  kanbanColumns = ['Open', 'InProgress', 'Resolved', 'Closed', 'Escalated'];

  // SLA trackers
  slaCompliancePct = 95.8;
  currentTime = new Date();
  private timerInterval: any;

  // Regional impairment drilldown
  regionsList = [
    { name: 'North', status: 'Clear', color: 'bg-emerald-500', border: 'border-emerald-600/30', count: 0 },
    { name: 'South', status: 'Clear', color: 'bg-emerald-500', border: 'border-emerald-600/30', count: 0 },
    { name: 'East', status: 'Clear', color: 'bg-emerald-500', border: 'border-emerald-600/30', count: 0 },
    { name: 'West', status: 'Clear', color: 'bg-emerald-500', border: 'border-emerald-600/30', count: 0 }
  ];
  selectedRegionFilter: string | null = null;

  // Escalation Queue
  escalatedQueue: any[] = [];
  isEscalateModalOpen = false;
  escalatingTicket: any = null;
  escalationReasonText = '';

  // User Lookup
  lookupUserId: number | null = null;
  lookupResult: any = null;
  isLookingUp = false;
  lookupError = '';

  // Plan Catalog (read-only reference)
  catalogPlans: any[] = [];
  catalogAddOns: any[] = [];

  constructor(
    public authService: AuthService,
    private iamService: IamService,
    private planService: PlanService,
    private ticketService: TicketService,
    private accountService: AccountService,
    public notificationService: NotificationService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.currentUser()!;
    this.loadTickets();
    this.loadStaff();

    // Start SLA countdown timer ticking every second
    this.timerInterval = setInterval(() => {
      this.currentTime = new Date();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  loadTickets(): void {
    this.ticketService.getFaultTickets().subscribe({
      next: (data) => {
        this.allTickets = data;
        this.updateRegionMetrics();
        this.loadEscalatedQueue();
        this.calculateSlaPercentage();
      },
      error: () => this.toastService.error('Failed to retrieve fault tickets.')
    });
  }

  loadStaff(): void {
    // Demo staff members for ticket assignment
    this.staffMembers = [
      { id: 4, name: 'Ned Network', email: 'networkops@teleconnect.com' },
      { id: 2, name: 'Alice Agent', email: 'agent@teleconnect.com' }
    ];
  }

  loadEscalatedQueue(): void {
    this.ticketService.getEscalatedTickets().subscribe(data => {
      this.escalatedQueue = data;
    });
  }

  calculateSlaPercentage(): void {
    const resolved = this.allTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
    if (resolved.length === 0) {
      this.slaCompliancePct = 100.0;
      return;
    }
    const complied = resolved.filter(t => {
      if (!t.resolvedDate) return true;
      const resTime = new Date(t.resolvedDate).getTime();
      const deadTime = new Date(t.slaDeadline).getTime();
      return resTime <= deadTime;
    }).length;
    this.slaCompliancePct = Math.round((complied / resolved.length) * 1000) / 10;
  }

  updateRegionMetrics(): void {
    // Reset counts
    this.regionsList.forEach(r => r.count = 0);
    
    // Count active tickets per region
    this.allTickets.forEach(t => {
      if (t.status !== 'Closed' && t.status !== 'Resolved') {
        const region = t.account.subscriber.regionId;
        const match = this.regionsList.find(r => r.name.toLowerCase() === region?.toLowerCase());
        if (match) match.count++;
      }
    });

    // Update severity colors
    this.regionsList.forEach(r => {
      if (r.count === 0) {
        r.status = 'Clear';
        r.color = 'bg-emerald-500';
        r.border = 'border-emerald-600/20';
      } else if (r.count <= 2) {
        r.status = 'Impaired';
        r.color = 'bg-amber-500';
        r.border = 'border-amber-600/20';
      } else {
        r.status = 'Outage';
        r.color = 'bg-rose-500';
        r.border = 'border-rose-600/20';
      }
    });
  }

  // ==========================================
  // Layout Controls
  // ==========================================
  setTab(tab: string): void {
    this.activeTab.set(tab);
    this.isNotificationOpen.set(false);
    if (tab === 'catalog') this.loadCatalog();
  }

  loadCatalog(): void {
    this.planService.getPlans(false).subscribe({ next: (data) => this.catalogPlans = data, error: () => {} });
    this.planService.getAddOns().subscribe({ next: (data) => this.catalogAddOns = data, error: () => {} });
  }

  getAddOnTypeLabel(type: string): string {
    const labels: Record<string, string> = { DataTopup: 'Data Top-Up', ISDPack: 'ISD Pack', RoamingPack: 'Roaming Pack', SMSPack: 'SMS Pack' };
    return labels[type] ?? type;
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

  // ── User Lookup ────────────────────────────────────────────────────────────────
  lookupUser(): void {
    if (!this.lookupUserId) return;
    this.isLookingUp = true;
    this.lookupResult = null;
    this.lookupError = '';
    this.iamService.getUser(this.lookupUserId).subscribe({
      next: (user) => { this.lookupResult = user; this.isLookingUp = false; },
      error: (err) => {
        this.isLookingUp = false;
        this.lookupError = err.status === 404 ? 'No user found with that ID.' : `Error: ${err.status}`;
      }
    });
  }

  clearLookup(): void {
    this.lookupUserId = null;
    this.lookupResult = null;
    this.lookupError = '';
  }

  getLookupRoleLabel(role: string): string {
    return ({ A: 'Admin', CS: 'Customer Service Agent', B: 'Billing Executive', N: 'Network Operations Engineer', C: 'Compliance Officer', S: 'Subscriber' } as Record<string, string>)[role] ?? role;
  }

  getLookupStatusLabel(status: string): string {
    return ({ A: 'Active', S: 'Suspended', I: 'Inactive' } as Record<string, string>)[status] ?? status;
  }

  // ==========================================
  // Kanban Operations
  // ==========================================
  getTicketsInColumn(col: string): any[] {
    let list = this.allTickets.filter(t => t.status === col);
    if (this.selectedRegionFilter) {
      list = list.filter(t => t.account.subscriber.regionId?.toLowerCase() === this.selectedRegionFilter?.toLowerCase());
    }
    return list;
  }

  moveTicket(ticketId: number, status: string): void {
    if (status === 'Escalated') {
      const ticket = this.allTickets.find(t => t.id === ticketId);
      this.openEscalateModal(ticket);
      return;
    }

    this.ticketService.updateFaultStatus(ticketId, status).subscribe({
      next: () => {
        this.iamService.recordAudit('TICKET_STATUS_UPDATED', 'NETOPS');
        this.toastService.success(`Ticket #${ticketId} status updated to ${status}.`);
        this.loadTickets();
      },
      error: () => this.toastService.error('Failed to move ticket status.')
    });
  }

  assignTicket(ticketId: number, engineerId: number): void {
    this.ticketService.assignTicket(ticketId, engineerId).subscribe({
      next: () => {
        this.iamService.recordAudit('TICKET_ASSIGNED', 'NETOPS');
        this.toastService.success(`Ticket #${ticketId} assigned.`);
        this.loadTickets();
      },
      error: () => this.toastService.error('Assign operation failed.')
    });
  }

  // ==========================================
  // SLA Timers & countdown formatting
  // ==========================================
  getSlaTimeRemaining(deadlineStr: string): string {
    const deadline = new Date(deadlineStr).getTime();
    const now = this.currentTime.getTime();
    const diff = deadline - now;

    if (diff <= 0) return 'BREACHED';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${mins}m`;
  }

  getSlaState(deadlineStr: string, status: string): 'breached' | 'risk' | 'normal' | 'resolved' {
    if (status === 'Resolved' || status === 'Closed') return 'resolved';
    
    const deadline = new Date(deadlineStr).getTime();
    const now = this.currentTime.getTime();
    const diff = deadline - now;

    if (diff <= 0) return 'breached';
    if (diff <= 2 * 60 * 60 * 1000) return 'risk'; // less than 2 hours left -> At Risk
    return 'normal';
  }

  // ==========================================
  // Regional Impairment Filters
  // ==========================================
  filterByRegion(region: string): void {
    if (this.selectedRegionFilter === region) {
      this.selectedRegionFilter = null; // toggle filter off
    } else {
      this.selectedRegionFilter = region;
      this.setTab('kanban'); // switch to kanban to view filtered list
    }
  }

  // ==========================================
  // Escalations
  // ==========================================
  openEscalateModal(ticket: any): void {
    this.escalatingTicket = ticket;
    this.escalationReasonText = '';
    this.isEscalateModalOpen = true;
  }

  closeEscalateModal(): void {
    this.isEscalateModalOpen = false;
    this.escalatingTicket = null;
    this.escalationReasonText = '';
  }

  submitEscalation(): void {
    if (!this.escalationReasonText.trim() || !this.escalatingTicket) return;

    this.ticketService.updateFaultStatus(this.escalatingTicket.id, 'Escalated', this.escalationReasonText).subscribe({
      next: () => {
        this.iamService.recordAudit('TICKET_ESCALATED', 'NETOPS');
        this.toastService.success(`Ticket #${this.escalatingTicket.id} escalated successfully.`);
        this.closeEscalateModal();
        this.loadTickets();
      },
      error: () => this.toastService.error('Failed to escalate ticket.')
    });
  }
}

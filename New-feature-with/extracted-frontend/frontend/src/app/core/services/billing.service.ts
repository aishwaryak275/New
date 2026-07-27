import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private base = 'http://localhost:9090/teleConnect/billing';

  constructor(private http: HttpClient) {}

  // ── Billing Cycles ───────────────────────────────────────────────────────────

  getBillingCycles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/cycles`);
  }

  getBillingCycle(cycleId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/cycles/${cycleId}`);
  }

  /**
   * Trigger a billing run. Components call: triggerBillingRun(cycleId, accountId)
   */
  triggerBillingRun(cycleId: number, accountId: number): Observable<any> {
    return this.http.post<any>(`${this.base}/cycles/generate`, { cycleId, accountId });
  }

  // ── Invoices ─────────────────────────────────────────────────────────────────

  getInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/invoices`);
  }

  getInvoice(invoiceId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/invoices/${invoiceId}`);
  }

  getInvoicesByAccount(accountId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/invoices/account/${accountId}`);
  }

  /**
   * Get current user's own invoices (no args needed).
   * Components call: getMyInvoices()
   */
  getMyInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/invoices/my`);
  }

  payInvoice(invoiceId: number, request: { amountPaid: number; paymentMethod: string; transactionRef?: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/invoices/${invoiceId}/pay`, request);
  }

  generateInvoice(req: { accountId: number; cycleId: number; planCharges: number; excessCharges: number; addOnCharges: number; taxes: number }): Observable<any> {
    return this.http.post<any>(`${this.base}/invoices/generate`, req);
  }

  downloadInvoice(invoiceId: number): Observable<Blob> {
    return this.http.get(`${this.base}/invoices/${invoiceId}/download`, { responseType: 'blob' });
  }

  createBillingCycle(accountId: number, cycleStart: string, cycleEnd: string): Observable<any> {
    return this.http.post<any>(`${this.base}/cycles`, { accountId, cycleStart, cycleEnd });
  }

  getCyclesByAccount(accountId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/cycles/account/${accountId}`);
  }

  markOverdueInvoices(): Observable<any> {
    return this.http.post<any>(`${this.base}/invoices/mark-overdue`, {});
  }

  /**
   * Apply late fees to all overdue invoices.
   * Components call: applyLateFees() — no args.
   */
  applyLateFees(): Observable<any> {
    return this.markOverdueInvoices();
  }

  // ── Disputes ─────────────────────────────────────────────────────────────────

  /**
   * Get all disputes. Components call: getDisputes() — no args.
   */
  getDisputes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/disputes`);
  }

  getDispute(disputeId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/disputes/${disputeId}`);
  }

  /**
   * Raise a billing dispute.
   * Subscriber portal calls: raiseDispute({ invoiceId, disputeReason, disputedAmount })
   */
  raiseDispute(request: { invoiceId: number; disputeReason?: string; disputedAmount?: number; [key: string]: any }): Observable<any> {
    return this.http.post<any>(`${this.base}/disputes`, request);
  }

  /**
   * Resolve a dispute. Components call: resolveDispute(id, status, remarks)
   */
  resolveDispute(disputeId: number, resolution: string, resolutionNotes: string): Observable<any> {
    return this.http.put<any>(`${this.base}/disputes/${disputeId}/resolve`, {
      resolution,
      resolutionNotes
    });
  }

  // ── Payments ─────────────────────────────────────────────────────────────────

  getPayments(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/payments`);
  }

  getPaymentsByInvoice(invoiceId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/payments/invoice/${invoiceId}`);
  }

  // ── Reports ──────────────────────────────────────────────────────────────────

  getRevenueReport(startDate: string, endDate: string): Observable<any> {
    return this.http.get<any>(`${this.base}/reports/revenue`, {
      params: { startDate, endDate }
    });
  }

  getOutstandingReport(): Observable<any> {
    return this.http.get<any>(`${this.base}/reports/outstanding`);
  }

  // ── System Config (no backend equivalent — stubbed for UI compatibility) ─────

  /**
   * Stub — no billing system-config endpoint exists in the backend.
   * Components call: getSystemConfig()
   */
  getSystemConfig(): Observable<any> {
    return of({
      lateFeePercentage: 2.5,
      gracePeriodDays: 7,
      autoPayEnabled: false,
      taxRate: 18.0
    });
  }

  /**
   * Stub — no backend endpoint for system config updates.
   * Components call: updateSystemConfig(config)
   */
  updateSystemConfig(config: any): Observable<any> {
    console.log('System config update (stub):', config);
    return of({ message: 'Configuration saved (local only).' });
  }
}

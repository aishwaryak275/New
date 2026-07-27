import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private subscriberBase = 'http://localhost:9090/teleConnect/api/subscribers';
  private iamBase = 'http://localhost:9090/teleConnect/iam/api';

  constructor(private http: HttpClient) {}

  // ── Account Lookup ───────────────────────────────────────────────────────────

  getAccount(accountId: number): Observable<any> {
    return this.http.get<any>(`${this.subscriberBase}/${accountId}`);
  }

  /** Legacy alias used by some portals. */
  getAccount360(accountId: number): Observable<any> {
    return this.getAccount(accountId);
  }

  /** Get subscriber accounts owned by the given IAM userId. */
  getAccountsBySubscriberId(userId: number): Observable<any[]> {
    return this.http.get<any>(`${this.subscriberBase}`, {
      params: { subscriberId: String(userId) }
    }).pipe(map((res: any) => res?.subscribers ?? (Array.isArray(res) ? res : [])));
  }

  /** Get SIM lines for an account. */
  getSimLines(accountId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.subscriberBase}/${accountId}/simLines`);
  }

  searchAccounts(query: string): Observable<any[]> {
    if (!query || query.trim() === '') {
      return this.http.get<any[]>(`${this.iamBase}/users`);
    }
    return this.http.get<any[]>(`${this.iamBase}/users/search`, {
      params: { name: query }
    });
  }

  getAllAccounts(): Observable<any[]> {
    return this.http.get<any>(`${this.subscriberBase}`).pipe(
      map((res: any) => res?.subscribers ?? (Array.isArray(res) ? res : []))
    );
  }

  // ── Account Management ───────────────────────────────────────────────────────

  createAccount(account: any): Observable<any> {
    return this.http.post<any>(`${this.subscriberBase}`, account);
  }

  updateAccount(accountId: number, account: any): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}`, account);
  }

  /**
   * Update account active/suspended status.
   * Components call: updateAccountStatus(id, 'Active' | 'Suspended' | 'Inactive')
   */
  updateAccountStatus(accountId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/status`, { status });
  }

  /**
   * Update KYC verification status.
   * Components call: updateKycStatus(id, 'Verified' | 'Pending' | 'Expired')
   */
  updateKycStatus(accountId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/kyc`, { kycStatus: status });
  }

  deleteAccount(accountId: number): Observable<any> {
    return this.http.delete<any>(`${this.subscriberBase}/${accountId}`);
  }

  getExpiredKyc(): Observable<any[]> {
    return this.http.get<any[]>(`${this.subscriberBase}/kyc/expired`);
  }

  // ── SIM Lines ────────────────────────────────────────────────────────────────

  getLines(accountId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.subscriberBase}/${accountId}/lines`);
  }

  getMyLines(): Observable<any[]> {
    return this.http.get<any[]>(`${this.subscriberBase}/my/lines`);
  }

  lookupByMsisdn(msisdn: string): Observable<any> {
    return this.http.get<any>(`${this.subscriberBase}/sim-lines/lookup`, {
      params: { msisdn }
    });
  }

  lookupByLineId(lineId: number): Observable<any> {
    return this.http.get<any>(`${this.subscriberBase}/sim-lines/lookup-by-id`, {
      params: { lineId: String(lineId) }
    });
  }

  addLine(accountId: number, line: any): Observable<any> {
    return this.http.post<any>(`${this.subscriberBase}/${accountId}/simLines`, line);
  }

  updateSimStatus(accountId: number, lineId: number, status: string): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/simLines/${lineId}/status`, { status });
  }

  replaceSim(accountId: number, lineId: number, iccid: string): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/simLines/${lineId}/replace`, { newIccid: iccid });
  }

  updateServiceType(accountId: number, lineId: number, serviceType: string): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/simLines/${lineId}/service-type`, { serviceType });
  }

  deleteSimLine(accountId: number, lineId: number): Observable<any> {
    return this.http.delete<any>(`${this.subscriberBase}/${accountId}/simLines/${lineId}`);
  }

  updateLine(accountId: number, lineId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/lines/${lineId}`, data);
  }

  suspendLine(accountId: number, lineId: number): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/lines/${lineId}/suspend`, {});
  }

  reactivateLine(accountId: number, lineId: number): Observable<any> {
    return this.http.put<any>(`${this.subscriberBase}/${accountId}/lines/${lineId}/reactivate`, {});
  }
}

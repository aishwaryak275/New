import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PlanService {
  private base = 'http://localhost:9090/teleConnect/plan';

  constructor(private http: HttpClient) {}

  // ── Plans ────────────────────────────────────────────────────────────────────

  /** activeOnly param is accepted for API compatibility; backend returns all plans. */
  getPlans(activeOnly = true): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/getAllPlans`);
  }

  getPlan(planId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/getPlans/${planId}`);
  }

  createPlan(plan: any): Observable<any> {
    return this.http.post<any>(`${this.base}/createPlans`, plan);
  }

  updatePlan(planId: number, plan: any): Observable<any> {
    return this.http.put<any>(`${this.base}/updatePlans/${planId}`, plan);
  }

  // ── Add-Ons ──────────────────────────────────────────────────────────────────

  getAddOns(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/getAllAddOns`);
  }

  getAddOn(addOnId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/getAddOns/${addOnId}`);
  }

  createAddOn(addOn: any): Observable<any> {
    return this.http.post<any>(`${this.base}/createAddOns`, addOn);
  }

  // ── Subscriptions ────────────────────────────────────────────────────────────

  getAllSubscriptions(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/getAllSubscriptions`);
  }

  getSubscription(subscriptionId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/getSubscriptions/${subscriptionId}`);
  }

  createSubscription(request: { lineId: number; planId: number; activationDate?: string; expiryDate?: string; renewalType?: string; status?: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/createSubscriptions`, request);
  }

  updateSubscription(subscriptionId: number, request: any): Observable<any> {
    return this.http.put<any>(`${this.base}/updateSubscriptions/${subscriptionId}`, request);
  }

  /** Activate a plan on a SIM line. */
  activatePlan(lineId: number, planId: number, renewalType = 'AutoRenew'): Observable<any> {
    return this.createSubscription({ lineId, planId, renewalType });
  }

  /** Request a future plan change. */
  requestPlanChange(lineId: number, targetPlanId: number, effectiveDate: string): Observable<any> {
    return this.createSubscription({ lineId, planId: targetPlanId });
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface TelecomReport {
  reportId: number;
  scope: string;
  scopeValue: string;
  periodStart: string;
  periodEnd: string;
  metrics: string;          // JSON string of computed metrics
  generatedDate: string;
  generatedBy: number;
}

/**
 * Analytics report store — the bridge for compliance review.
 * Billing / NetOps GENERATE reports; Compliance LISTS and reviews them.
 * (Backend: analytics-service /api/reports)
 */
@Injectable({ providedIn: 'root' })
export class ReportService {
  private base = 'http://localhost:9090/teleConnect/api/reports';

  constructor(private http: HttpClient) {}

  /** Billing / NetOps generate a report snapshot that flows to Compliance. */
  generateReport(req: {
    scope: 'REGION' | 'PLAN' | 'SEGMENT' | 'PERIOD';
    scopeValue: string;
    periodStart: string;
    periodEnd: string;
    generatedBy?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/generate`, req);
  }

  /** Compliance lists the generated reports (paginated envelope → flat array). */
  listReports(page = 0, size = 50): Observable<TelecomReport[]> {
    return this.http.get<any>(`${this.base}`, { params: { page: String(page), size: String(size) } }).pipe(
      map(res => {
        const data = res?.data ?? res;
        return data?.content ?? (Array.isArray(data) ? data : []);
      })
    );
  }

  getReport(reportId: number): Observable<TelecomReport> {
    return this.http.get<any>(`${this.base}/${reportId}`).pipe(map(res => res?.data ?? res));
  }
}

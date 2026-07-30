import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private base = 'http://localhost:9090/teleConnect/fault';

  constructor(private http: HttpClient) {}

  // ── Fault Tickets ────────────────────────────────────────────────────────────

  getFaultTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/getAllTickets`);
  }

  getFaultTicket(ticketId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/getTickets/${ticketId}`);
  }

  createFaultTicket(ticket: any): Observable<any> {
    return this.http.post<any>(`${this.base}/createTickets`, ticket);
  }

  updateFaultTicket(ticketId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/updateTickets/${ticketId}`, data);
  }

  resolveFaultTicket(ticketId: number, resolution: any): Observable<any> {
    return this.http.put<any>(`${this.base}/resolveTickets/${ticketId}`, resolution);
  }

  /**
   * Assign a fault ticket to an engineer.
   * Components call: assignTicket(ticketId, engineerId)
   */
  assignTicket(ticketId: number, engineerId: number): Observable<any> {
    // Backend FaultTicketRequest expects the field `assignedToId`, not `engineerId`.
    return this.http.put<any>(`${this.base}/assignTickets/${ticketId}`, { assignedToId: engineerId });
  }

  /**
   * Alias for NetOps portal: returns all fault tickets flagged as escalated.
   * Backend has no separate escalation endpoint — returns all tickets for NOC review.
   * Components call: getEscalatedTickets()
   */
  getEscalatedTickets(): Observable<any[]> {
    return this.getFaultTickets();
  }

  updateFaultStatus(ticketId: number, status: string, reason?: string): Observable<any> {
    // Backend expects the status code (O/P/R/C/E). Accept either a word or a code.
    const codeMap: Record<string, string> = {
      Open: 'O', InProgress: 'P', Resolved: 'R', Closed: 'C', Escalated: 'E'
    };
    const statusCode = codeMap[status] ?? status;
    return this.http.put<any>(`${this.base}/updateTickets/${ticketId}`, { status: statusCode, reason });
  }

  // ── Service Requests ─────────────────────────────────────────────────────────

  getServiceRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/getAllRequests`);
  }

  /** Alias used by agent and subscriber portals: getRequests() */
  getRequests(): Observable<any[]> {
    return this.getServiceRequests();
  }

  getServiceRequest(requestId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/getRequests/${requestId}`);
  }

  createServiceRequest(request: any): Observable<any> {
    return this.http.post<any>(`${this.base}/createRequests`, request);
  }

  /** Alias used by subscriber portal: createRequest(data) */
  createRequest(request: any): Observable<any> {
    return this.createServiceRequest(request);
  }

  updateServiceRequest(requestId: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/updateRequests/${requestId}`, data);
  }

  /** Update a service request's status. Agent portal calls: updateRequestStatus(id, status) */
  updateRequestStatus(requestId: number, status: string): Observable<any> {
    // Backend expects the status code (O/P/C/X). Accept either a word or a code.
    const codeMap: Record<string, string> = {
      Open: 'O', InProgress: 'P', Completed: 'C', Cancelled: 'X'
    };
    const statusCode = codeMap[status] ?? status;
    return this.http.put<any>(`${this.base}/updateRequests/${requestId}`, { status: statusCode });
  }

  /** Cancel an Open service request (subscriber self-service). */
  cancelRequest(requestId: number): Observable<any> {
    return this.http.put<any>(`${this.base}/cancelRequests/${requestId}`, {});
  }

  /** Approve a NewConnection service request */
  approveConnection(requestId: number): Observable<any> {
    return this.http.post<any>(`${this.base}/requests/${requestId}/approve-connection`, {});
  }
}

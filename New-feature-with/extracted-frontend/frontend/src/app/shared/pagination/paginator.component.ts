import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Compact, reusable pager. Renders nothing when everything fits on one page.
 *
 * Usage:
 *   <app-paginator [total]="items.length" [page]="page" [size]="8"
 *                  (pageChange)="page = $event"></app-paginator>
 */
@Component({
  selector: 'app-paginator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="totalPages > 1" class="flex items-center justify-between gap-3 px-1 py-3">
      <p class="text-xs text-slate-400">
        {{ startIndex + 1 }}–{{ endIndex }} of {{ total }}
      </p>
      <div class="flex items-center gap-1">
        <button type="button" (click)="go(page - 1)" [disabled]="page <= 1"
          class="w-8 h-8 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
        <button type="button" *ngFor="let p of pages" (click)="go(p)"
          class="min-w-8 h-8 px-2 rounded-lg text-sm border transition-colors"
          [ngClass]="p === page ? 'bg-primary-700 text-white border-primary-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'">{{ p }}</button>
        <button type="button" (click)="go(page + 1)" [disabled]="page >= totalPages"
          class="w-8 h-8 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
      </div>
    </div>
  `
})
export class PaginatorComponent {
  @Input() total = 0;
  @Input() page = 1;
  @Input() size = 8;
  @Output() pageChange = new EventEmitter<number>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.size));
  }
  get startIndex(): number {
    return (this.clamped - 1) * this.size;
  }
  get endIndex(): number {
    return Math.min(this.total, this.startIndex + this.size);
  }
  private get clamped(): number {
    return Math.min(Math.max(1, this.page), this.totalPages);
  }
  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
  go(p: number): void {
    const target = Math.min(Math.max(1, p), this.totalPages);
    if (target !== this.page) this.pageChange.emit(target);
  }
}

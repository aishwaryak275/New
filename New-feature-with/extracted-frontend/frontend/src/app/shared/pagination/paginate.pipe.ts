import { Pipe, PipeTransform } from '@angular/core';

/**
 * Returns the slice of `items` for the given 1-based `page` and `size`.
 * Pure pipe — recomputes only when items/page/size change.
 *
 * Usage: *ngFor="let x of (items | paginate: page : 8)"
 */
@Pipe({ name: 'paginate', standalone: true })
export class PaginatePipe implements PipeTransform {
  transform<T>(items: T[] | null | undefined, page: number, size: number): T[] {
    if (!Array.isArray(items)) return [];
    const p = Math.max(1, page || 1);
    const start = (p - 1) * size;
    return items.slice(start, start + size);
  }
}

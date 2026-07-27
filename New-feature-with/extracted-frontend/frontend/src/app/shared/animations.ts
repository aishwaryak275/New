import { animate, query, stagger, style, transition, trigger, keyframes } from '@angular/animations';

export const fadeInUp = trigger('fadeInUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(15px)' }),
    animate('250ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
  ])
]);

export const staggerFadeIn = trigger('staggerFadeIn', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(15px)' }),
      stagger('50ms', [
        animate('300ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);

export const slideHorizontal = trigger('slideHorizontal', [
  transition(':increment', [
    style({ transform: 'translateX(100%)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateX(0%)', opacity: 1 }))
  ]),
  transition(':decrement', [
    style({ transform: 'translateX(-100%)', opacity: 0 }),
    animate('300ms ease-out', style({ transform: 'translateX(0%)', opacity: 1 }))
  ])
]);

export const shake = trigger('shake', [
  transition('* => shake', [
    animate('500ms', keyframes([
      style({ transform: 'rotate(0deg)', offset: 0 }),
      style({ transform: 'rotate(15deg)', offset: 0.1 }),
      style({ transform: 'rotate(-15deg)', offset: 0.2 }),
      style({ transform: 'rotate(10deg)', offset: 0.3 }),
      style({ transform: 'rotate(-10deg)', offset: 0.4 }),
      style({ transform: 'rotate(5deg)', offset: 0.5 }),
      style({ transform: 'rotate(-5deg)', offset: 0.6 }),
      style({ transform: 'rotate(0deg)', offset: 1.0 })
    ]))
  ])
]);

export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ opacity: 0, transform: 'scale(0.95)' }),
    animate('200ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 1, transform: 'scale(1)' }))
  ]),
  transition(':leave', [
    animate('150ms cubic-bezier(0.16, 1, 0.3, 1)', style({ opacity: 0, transform: 'scale(0.95)' }))
  ])
]);

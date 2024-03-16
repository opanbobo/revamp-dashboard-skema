import { Component, Input } from '@angular/core';

@Component({
  selector: 'icon-cable',
  standalone: true,
  imports: [],
  template: `
    <svg
      width="21"
      height="20"
      viewBox="0 0 21 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.3561 1.09599L19.3168 0.0563934C19.2776 0.0171632 19.2286 0 19.1771 0C19.1256 0 19.0766 0.0196151 19.0374 0.0563934L17.1721 1.92228C16.3612 1.37269 15.4038 1.07968 14.4244 1.08128C13.1694 1.08128 11.9144 1.5594 10.956 2.51808L8.45829 5.01655C8.4218 5.05342 8.40133 5.1032 8.40133 5.15508C8.40133 5.20696 8.4218 5.25675 8.45829 5.29361L15.118 11.9554C15.1572 11.9946 15.2063 12.0118 15.2577 12.0118C15.3068 12.0118 15.3582 11.9922 15.3975 11.9554L17.8952 9.45691C19.584 7.76511 19.7825 5.14895 18.4908 3.24139L20.3561 1.37551C20.4321 1.29705 20.4321 1.172 20.3561 1.09599ZM16.7137 8.27755L15.2577 9.73397L10.679 5.15385L12.135 3.69744C12.7453 3.08692 13.5591 2.74856 14.4244 2.74856C15.2896 2.74856 16.1009 3.08447 16.7137 3.69744C17.324 4.30796 17.6623 5.12198 17.6623 5.98749C17.6623 6.85301 17.324 7.66458 16.7137 8.27755ZM12.0517 10.852C12.0148 10.8155 11.965 10.795 11.9132 10.795C11.8613 10.795 11.8115 10.8155 11.7747 10.852L10.1422 12.485L7.92885 10.2709L9.56376 8.63553C9.63974 8.55952 9.63974 8.43447 9.56376 8.35847L8.67154 7.46598C8.63469 7.42948 8.58492 7.409 8.53305 7.409C8.48119 7.409 8.43142 7.42948 8.39457 7.46598L6.75966 9.10139L5.70567 8.04708C5.68737 8.02876 5.66557 8.01432 5.64156 8.00463C5.61755 7.99494 5.59184 7.9902 5.56596 7.99068C5.51693 7.99068 5.46546 8.0103 5.42624 8.04708L2.93099 10.5455C1.24216 12.2373 1.04362 14.8535 2.33536 16.7611L0.47005 18.6269C0.433557 18.6638 0.413086 18.7136 0.413086 18.7655C0.413086 18.8174 0.433557 18.8671 0.47005 18.904L1.50933 19.9436C1.54855 19.9828 1.59757 20 1.64905 20C1.70052 20 1.74954 19.9804 1.78876 19.9436L3.65407 18.0777C4.4801 18.6392 5.44095 18.9187 6.40179 18.9187C7.65677 18.9187 8.91175 18.4406 9.87015 17.4819L12.3679 14.9834C12.4438 14.9074 12.4438 14.7824 12.3679 14.7064L11.3139 13.6521L12.9488 12.0167C13.0248 11.9407 13.0248 11.8156 12.9488 11.7396L12.0517 10.852ZM8.6887 16.305C8.3887 16.6066 8.03192 16.8458 7.63897 17.0087C7.24602 17.1715 6.82469 17.2549 6.39934 17.2539C5.53409 17.2539 4.72277 16.918 4.10998 16.305C3.80845 16.0049 3.56936 15.648 3.40655 15.255C3.24373 14.8619 3.1604 14.4404 3.16139 14.015C3.16139 13.1494 3.4972 12.3379 4.10998 11.7249L5.56596 10.2685L10.1447 14.8486L8.6887 16.305Z"
        [attr.fill]="fill"
        [attr.class]="class"
      />
    </svg>
  `,
  styles: ``,
})
export class IconCableComponent {
  @Input() class = '';
  @Input() fill = '#8A90AB';
}

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-subscription-expired',
  templateUrl: './subscription-expired.component.html',
  styleUrls: ['./subscription-expired.component.scss']
})
export class SubscriptionExpiredComponent {}

import { Directive, TemplateRef, input } from '@angular/core';

@Directive({
  selector: '[appGridCell]',
  standalone: true,
})
export class GridCellDirective {
  name = input.required<string>({ alias: 'appGridCell' });

  constructor(public templateRef: TemplateRef<any>) {}
}

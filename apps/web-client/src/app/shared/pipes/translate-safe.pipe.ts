import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'translateSafe' })
export class TranslateSafePipe implements PipeTransform { transform(value: any): any { return value; } }
import { Pipe, PipeTransform } from '@angular/core';
@Pipe({ name: 'currencyFormat' })
export class CurrencyFormatPipe implements PipeTransform { transform(value: any): any { return value; } }
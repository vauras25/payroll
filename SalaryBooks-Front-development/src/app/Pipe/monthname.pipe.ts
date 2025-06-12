import { Pipe, PipeTransform } from '@angular/core';
import * as Global from 'src/app/globals';

@Pipe({
  name: 'monthname'
})
export class MonthnamePipe implements PipeTransform {
  Global=Global;

  transform(value: any, ...args: unknown[]): unknown {
    let item:any=Global.monthMaster.find(x=> x.index==value)
    return item.description;
  }

}

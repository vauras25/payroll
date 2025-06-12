import { Pipe, PipeTransform } from '@angular/core';
import * as Global from 'src/app/globals';

@Pipe({
  name: 'leaveHead'
})
export class LeaveHeadPipe implements PipeTransform {
  Global=Global;

  transform(value: unknown, ...args: unknown[]): unknown {
    let item:any=Global.attendance_head.find(x=> x.value==value)
    if(item)
    {
      return item.name;

    }
    else{
      return null;
    }
  }

}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'strtojson'
})
export class StrtojsonPipe implements PipeTransform {

  transform(value: any, ...args: unknown[]): unknown {
    let leave_temp_head=JSON.parse(value);

    // console.log(leave_temp_head);
    return leave_temp_head.full_name;
  }

}

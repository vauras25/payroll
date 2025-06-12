import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dynamicFilter'
})
export class DynamicFilterPipe implements PipeTransform {

  transform(items: any[], filter: any): any[] {
    if (!items || !filter) {
      return items;
    }

    const type = typeof filter;
    if (type === 'function') {
      return items.filter(filter);
    } else {
      return items.filter(item => this.compare(item, filter));
    }
  }

  // This function compares all properties of filter object with item object to check if item is matched with filter object or not.
  compare(item:any, filter:any) {
    for (const prop in filter) {
      if (filter[prop] !== item[prop]) {
        return false;
      }
    }
    return true;
  }
}
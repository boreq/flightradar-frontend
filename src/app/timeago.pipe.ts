import { Pipe, PipeTransform } from '@angular/core';

declare var moment: any;

@Pipe({name: 'timeago'})
export class TimeAgoPipe implements PipeTransform {

  transform(value: Date): number {
    return moment(value).fromNow();
  }

}

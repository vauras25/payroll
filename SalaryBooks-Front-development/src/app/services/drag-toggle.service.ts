import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DragToggleService {
  private dragEnabled = new BehaviorSubject<boolean>(false);
  dragEnabled$ = this.dragEnabled.asObservable();

  setDragEnabled(value: boolean) {
    this.dragEnabled.next(value);
  }
}

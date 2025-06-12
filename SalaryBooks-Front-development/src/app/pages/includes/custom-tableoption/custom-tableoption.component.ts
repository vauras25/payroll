import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import * as Global from 'src/app/globals';

@Component({
  selector: 'app-custom-tableoption',
  templateUrl: './custom-tableoption.component.html',
  styleUrls: ['./custom-tableoption.component.css']
})
export class CustomTableoptionComponent implements OnInit {
  TableOptionForm: UntypedFormGroup;
  Global = Global;
  private destroy$ = new Subject<void>();
  @Input() lengthChange: boolean = true;
  @Input() searchable: boolean = true;
  @Output() onFilterChanged: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    public formBuilder: UntypedFormBuilder,
  ) {
    this.TableOptionForm = formBuilder.group({
      length: [Global.DataTableLength, Validators.compose([])],
      searchkey: [null, Validators.compose([])],
    });
  }

  ngOnInit(): void {
    this.TableOptionForm.get('searchkey')?.valueChanges
    .pipe(
      debounceTime(700),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    )
    .subscribe(value => {
      this.onFilterChanged.emit(this.TableOptionForm.value);
    });
  }

  filterChanged() {
    // console.log('this.TableOptionForm.value : ', this.TableOptionForm.value);
    this.onFilterChanged.emit(this.TableOptionForm.value)
  }
  ngOnDestroy(): void {
    this.destroy$.next(); // Cleanup all subscriptions
    this.destroy$.complete();
  }
}

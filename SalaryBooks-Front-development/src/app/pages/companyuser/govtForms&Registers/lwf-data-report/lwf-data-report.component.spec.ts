/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { LwfDataReportComponent } from './lwf-data-report.component';

describe('LwfDataReportComponent', () => {
  let component: LwfDataReportComponent;
  let fixture: ComponentFixture<LwfDataReportComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LwfDataReportComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LwfDataReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TdsReportListingComponent } from './tds-report-listing.component';

describe('TdsReportListingComponent', () => {
  let component: TdsReportListingComponent;
  let fixture: ComponentFixture<TdsReportListingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TdsReportListingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TdsReportListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

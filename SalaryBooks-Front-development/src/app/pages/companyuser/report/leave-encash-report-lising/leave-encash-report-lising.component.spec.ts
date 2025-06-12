import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveEncashReportLisingComponent } from './leave-encash-report-lising.component';

describe('LeaveEncashReportLisingComponent', () => {
  let component: LeaveEncashReportLisingComponent;
  let fixture: ComponentFixture<LeaveEncashReportLisingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeaveEncashReportLisingComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveEncashReportLisingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

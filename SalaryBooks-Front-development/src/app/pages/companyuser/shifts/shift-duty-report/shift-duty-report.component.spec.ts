import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftDutyReportComponent } from './shift-duty-report.component';

describe('ShiftDutyReportComponent', () => {
  let component: ShiftDutyReportComponent;
  let fixture: ComponentFixture<ShiftDutyReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShiftDutyReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftDutyReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

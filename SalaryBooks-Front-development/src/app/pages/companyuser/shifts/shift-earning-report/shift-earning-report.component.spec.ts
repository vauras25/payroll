import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShiftEarningReportComponent } from './shift-earning-report.component';

describe('ShiftEarningReportComponent', () => {
  let component: ShiftEarningReportComponent;
  let fixture: ComponentFixture<ShiftEarningReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ShiftEarningReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShiftEarningReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

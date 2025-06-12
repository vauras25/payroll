import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EarnedLeaveReportComponent } from './earned-leave-report.component';

describe('EarnedLeaveReportComponent', () => {
  let component: EarnedLeaveReportComponent;
  let fixture: ComponentFixture<EarnedLeaveReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EarnedLeaveReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EarnedLeaveReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

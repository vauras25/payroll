import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateReportSummaryComponent } from './late-report-summary.component';

describe('LateReportSummaryComponent', () => {
  let component: LateReportSummaryComponent;
  let fixture: ComponentFixture<LateReportSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LateReportSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LateReportSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

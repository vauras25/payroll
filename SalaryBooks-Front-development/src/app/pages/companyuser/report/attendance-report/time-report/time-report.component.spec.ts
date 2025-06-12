import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeReportComponent } from './time-report.component';

describe('TimeReportComponent', () => {
  let component: TimeReportComponent;
  let fixture: ComponentFixture<TimeReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TimeReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

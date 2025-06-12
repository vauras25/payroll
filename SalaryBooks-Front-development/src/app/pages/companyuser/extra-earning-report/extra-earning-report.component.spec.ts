import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraEarningReportComponent } from './extra-earning-report.component';

describe('ExtraEarningReportComponent', () => {
  let component: ExtraEarningReportComponent;
  let fixture: ComponentFixture<ExtraEarningReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraEarningReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraEarningReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

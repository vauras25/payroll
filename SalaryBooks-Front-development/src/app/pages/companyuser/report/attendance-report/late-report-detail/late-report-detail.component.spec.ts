import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LateReportDetailComponent } from './late-report-detail.component';

describe('LateReportDetailComponent', () => {
  let component: LateReportDetailComponent;
  let fixture: ComponentFixture<LateReportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LateReportDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LateReportDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

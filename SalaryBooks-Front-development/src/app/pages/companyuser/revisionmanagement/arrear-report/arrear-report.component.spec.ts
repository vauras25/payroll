import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ArrearReportComponent } from './arrear-report.component';

describe('ArrearReportComponent', () => {
  let component: ArrearReportComponent;
  let fixture: ComponentFixture<ArrearReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ArrearReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ArrearReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdsCustomReportComponent } from './tds-custom-report.component';

describe('TdsCustomReportComponent', () => {
  let component: TdsCustomReportComponent;
  let fixture: ComponentFixture<TdsCustomReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TdsCustomReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TdsCustomReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

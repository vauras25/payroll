import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MonthWiseSummaryComponent } from './month-wise-summary.component';

describe('MonthWiseSummaryComponent', () => {
  let component: MonthWiseSummaryComponent;
  let fixture: ComponentFixture<MonthWiseSummaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MonthWiseSummaryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MonthWiseSummaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

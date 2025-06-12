import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditUsageDetailComponent } from './credit-usage-detail.component';

describe('CreditUsageDetailComponent', () => {
  let component: CreditUsageDetailComponent;
  let fixture: ComponentFixture<CreditUsageDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditUsageDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditUsageDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditUsageComponent } from './credit-usage.component';

describe('CreditUsageComponent', () => {
  let component: CreditUsageComponent;
  let fixture: ComponentFixture<CreditUsageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditUsageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreditUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReimbursementBankComponent } from './reimbursement-bank.component';

describe('ReimbursementBankComponent', () => {
  let component: ReimbursementBankComponent;
  let fixture: ComponentFixture<ReimbursementBankComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ReimbursementBankComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReimbursementBankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompanyLedgerComponent } from './company-ledger.component';

describe('CompanyLedgerComponent', () => {
  let component: CompanyLedgerComponent;
  let fixture: ComponentFixture<CompanyLedgerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CompanyLedgerComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompanyLedgerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

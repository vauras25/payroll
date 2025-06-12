import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveLedgerReportComponent } from './leave-ledger-report.component';

describe('LeaveLedgerReportComponent', () => {
  let component: LeaveLedgerReportComponent;
  let fixture: ComponentFixture<LeaveLedgerReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LeaveLedgerReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveLedgerReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

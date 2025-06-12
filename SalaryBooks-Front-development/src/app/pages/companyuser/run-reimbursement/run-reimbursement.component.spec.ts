import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RunReimbursementComponent } from './run-reimbursement.component';

describe('RunReimbursementComponent', () => {
  let component: RunReimbursementComponent;
  let fixture: ComponentFixture<RunReimbursementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RunReimbursementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RunReimbursementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

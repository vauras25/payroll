import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BankInstructionComponent } from './bank-instruction.component';

describe('BankInstructionComponent', () => {
  let component: BankInstructionComponent;
  let fixture: ComponentFixture<BankInstructionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BankInstructionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BankInstructionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraDeductionComponent } from './extra-deduction.component';

describe('ExtraDeductionComponent', () => {
  let component: ExtraDeductionComponent;
  let fixture: ComponentFixture<ExtraDeductionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraDeductionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraDeductionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

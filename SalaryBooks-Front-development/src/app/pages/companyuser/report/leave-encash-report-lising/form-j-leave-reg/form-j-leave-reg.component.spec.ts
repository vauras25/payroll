import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormJLeaveRegComponent } from './form-j-leave-reg.component';

describe('FormJLeaveRegComponent', () => {
  let component: FormJLeaveRegComponent;
  let fixture: ComponentFixture<FormJLeaveRegComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormJLeaveRegComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormJLeaveRegComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

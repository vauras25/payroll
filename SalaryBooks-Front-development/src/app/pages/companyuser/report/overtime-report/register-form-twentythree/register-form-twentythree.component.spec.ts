import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterFormTwentythreeComponent } from './register-form-twentythree.component';

describe('RegisterFormTwentythreeComponent', () => {
  let component: RegisterFormTwentythreeComponent;
  let fixture: ComponentFixture<RegisterFormTwentythreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegisterFormTwentythreeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterFormTwentythreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

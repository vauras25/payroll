import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormEComponent } from './form-e.component';

describe('FormEComponent', () => {
  let component: FormEComponent;
  let fixture: ComponentFixture<FormEComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormEComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormEComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

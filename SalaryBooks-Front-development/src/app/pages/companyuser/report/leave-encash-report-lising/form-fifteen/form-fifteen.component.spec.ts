import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormFifteenComponent } from './form-fifteen.component';

describe('FormFifteenComponent', () => {
  let component: FormFifteenComponent;
  let fixture: ComponentFixture<FormFifteenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormFifteenComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormFifteenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

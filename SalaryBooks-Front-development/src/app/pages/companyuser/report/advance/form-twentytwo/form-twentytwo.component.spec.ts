import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormTwentytwoComponent } from './form-twentytwo.component';

describe('FormTwentytwoComponent', () => {
  let component: FormTwentytwoComponent;
  let fixture: ComponentFixture<FormTwentytwoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FormTwentytwoComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormTwentytwoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FormAComponent } from './form-A.component';

describe('FormAComponent', () => {
  let component: FormAComponent;
  let fixture: ComponentFixture<FormAComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FormAComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FormAComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

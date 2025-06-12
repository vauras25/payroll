/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { GratuityFormLComponent } from './gratuity-Form-L.component';

describe('GratuityFormLComponent', () => {
  let component: GratuityFormLComponent;
  let fixture: ComponentFixture<GratuityFormLComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GratuityFormLComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GratuityFormLComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

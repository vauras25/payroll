/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { PtaxReturnDataComponent } from './ptax-return-data.component';

describe('PtaxReturnDataComponent', () => {
  let component: PtaxReturnDataComponent;
  let fixture: ComponentFixture<PtaxReturnDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PtaxReturnDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PtaxReturnDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

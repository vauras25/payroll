/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { Esic37and7aComponent } from './esic37and7a.component';

describe('Esic37and7aComponent', () => {
  let component: Esic37and7aComponent;
  let fixture: ComponentFixture<Esic37and7aComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Esic37and7aComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Esic37and7aComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

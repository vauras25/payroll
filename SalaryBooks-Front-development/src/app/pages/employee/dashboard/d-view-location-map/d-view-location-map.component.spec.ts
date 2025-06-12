/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DViewLocationMapComponent } from './d-view-location-map.component';

describe('DViewLocationMapComponent', () => {
  let component: DViewLocationMapComponent;
  let fixture: ComponentFixture<DViewLocationMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DViewLocationMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DViewLocationMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

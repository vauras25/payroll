import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtFormfourComponent } from './ot-formfour.component';

describe('OtFormfourComponent', () => {
  let component: OtFormfourComponent;
  let fixture: ComponentFixture<OtFormfourComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OtFormfourComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtFormfourComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

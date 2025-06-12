import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OtIndividualComponent } from './ot-individual.component';

describe('OtIndividualComponent', () => {
  let component: OtIndividualComponent;
  let fixture: ComponentFixture<OtIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OtIndividualComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OtIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

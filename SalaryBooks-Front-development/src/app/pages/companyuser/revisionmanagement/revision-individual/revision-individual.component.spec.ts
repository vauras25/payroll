import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionIndividualComponent } from './revision-individual.component';

describe('RevisionIndividualComponent', () => {
  let component: RevisionIndividualComponent;
  let fixture: ComponentFixture<RevisionIndividualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevisionIndividualComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevisionIndividualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

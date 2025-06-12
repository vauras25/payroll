import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraEarningRunComponent } from './extra-earning-run.component';

describe('ExtraEarningRunComponent', () => {
  let component: ExtraEarningRunComponent;
  let fixture: ComponentFixture<ExtraEarningRunComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraEarningRunComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraEarningRunComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

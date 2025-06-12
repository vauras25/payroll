import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtraEarningComponent } from './extra-earning.component';

describe('ExtraEarningComponent', () => {
  let component: ExtraEarningComponent;
  let fixture: ComponentFixture<ExtraEarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExtraEarningComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraEarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

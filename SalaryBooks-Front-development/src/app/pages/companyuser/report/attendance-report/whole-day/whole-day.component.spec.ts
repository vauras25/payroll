import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WholeDayComponent } from './whole-day.component';

describe('WholeDayComponent', () => {
  let component: WholeDayComponent;
  let fixture: ComponentFixture<WholeDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WholeDayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WholeDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewPendingTdsComponent } from './view-pending-tds.component';

describe('ViewPendingTdsComponent', () => {
  let component: ViewPendingTdsComponent;
  let fixture: ComponentFixture<ViewPendingTdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewPendingTdsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewPendingTdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

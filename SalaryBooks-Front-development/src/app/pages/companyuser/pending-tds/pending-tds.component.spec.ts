import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PendingTdsComponent } from './pending-tds.component';

describe('PendingTdsComponent', () => {
  let component: PendingTdsComponent;
  let fixture: ComponentFixture<PendingTdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PendingTdsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PendingTdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

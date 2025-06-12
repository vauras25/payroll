import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomAdvanceComponent } from './custom-advance.component';

describe('CustomAdvanceComponent', () => {
  let component: CustomAdvanceComponent;
  let fixture: ComponentFixture<CustomAdvanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomAdvanceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomAdvanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

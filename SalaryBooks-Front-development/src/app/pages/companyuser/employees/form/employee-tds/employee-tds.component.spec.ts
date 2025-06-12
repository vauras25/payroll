import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeTdsComponent } from './employee-tds.component';

describe('EmployeeTdsComponent', () => {
  let component: EmployeeTdsComponent;
  let fixture: ComponentFixture<EmployeeTdsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ EmployeeTdsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeTdsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

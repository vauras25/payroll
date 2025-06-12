import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdsRulesComponent } from './tds-rules.component';

describe('TdsRulesComponent', () => {
  let component: TdsRulesComponent;
  let fixture: ComponentFixture<TdsRulesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TdsRulesComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TdsRulesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

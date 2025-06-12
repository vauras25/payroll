import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdsRuleDeclarationComponent } from './tds-rule-declaration.component';

describe('TdsRuleDeclarationComponent', () => {
  let component: TdsRuleDeclarationComponent;
  let fixture: ComponentFixture<TdsRuleDeclarationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TdsRuleDeclarationComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TdsRuleDeclarationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

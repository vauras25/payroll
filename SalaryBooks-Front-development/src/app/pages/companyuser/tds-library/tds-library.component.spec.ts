import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TdsLibraryComponent } from './tds-library.component';

describe('TdsLibraryComponent', () => {
  let component: TdsLibraryComponent;
  let fixture: ComponentFixture<TdsLibraryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TdsLibraryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TdsLibraryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

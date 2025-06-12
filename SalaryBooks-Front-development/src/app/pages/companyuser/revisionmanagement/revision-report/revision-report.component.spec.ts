import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RevisionReportComponent } from './revision-report.component';

describe('RevisionReportComponent', () => {
  let component: RevisionReportComponent;
  let fixture: ComponentFixture<RevisionReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RevisionReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RevisionReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { SubadminGuard } from './subadmin.guard';

describe('SubadminGuard', () => {
  let guard: SubadminGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(SubadminGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

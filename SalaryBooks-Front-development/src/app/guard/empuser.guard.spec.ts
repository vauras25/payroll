import { TestBed } from '@angular/core/testing';

import { EmpuserGuard } from './empuser.guard';

describe('EmpuserGuard', () => {
  let guard: EmpuserGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(EmpuserGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

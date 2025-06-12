import { TestBed } from '@angular/core/testing';

import { CompanyuserGuard } from './companyuser.guard';

describe('CompanyuserGuard', () => {
  let guard: CompanyuserGuard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    guard = TestBed.inject(CompanyuserGuard);
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });
});

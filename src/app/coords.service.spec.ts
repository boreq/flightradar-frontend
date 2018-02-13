import { TestBed, inject } from '@angular/core/testing';

import { CoordsService } from './coords.service';

describe('CoordsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CoordsService]
    });
  });

  it('should be created', inject([CoordsService], (service: CoordsService) => {
    expect(service).toBeTruthy();
  }));
});

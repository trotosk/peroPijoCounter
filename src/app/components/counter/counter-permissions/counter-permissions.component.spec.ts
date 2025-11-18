import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterPermissionsComponent } from './counter-permissions.component';

describe('CounterPermissionsComponent', () => {
  let component: CounterPermissionsComponent;
  let fixture: ComponentFixture<CounterPermissionsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterPermissionsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterPermissionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

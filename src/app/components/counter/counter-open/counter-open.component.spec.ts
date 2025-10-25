import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterOpenComponent } from './counter-open.component';

describe('CounterOpenComponent', () => {
  let component: CounterOpenComponent;
  let fixture: ComponentFixture<CounterOpenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterOpenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterOpenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CounterEditComponent } from './counter-edit.component';

describe('CounterEditComponent', () => {
  let component: CounterEditComponent;
  let fixture: ComponentFixture<CounterEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CounterEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CounterEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateCounterTypeDialogComponent } from './create-counter-type-dialog.component';

describe('CreateCounterTypeDialogComponent', () => {
  let component: CreateCounterTypeDialogComponent;
  let fixture: ComponentFixture<CreateCounterTypeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateCounterTypeDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateCounterTypeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

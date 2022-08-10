import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';

import { Subject, takeUntil } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import { ApiTestRest } from '../../../../shared/services/api-test/api-test.model';
import { ApiTestUtilService } from '../api-test-util.service';
@Component({
  selector: 'eo-api-test-rest',
  templateUrl: './api-test-rest.component.html',
  styleUrls: ['./api-test-rest.component.scss'],
})
export class ApiTestRestComponent implements OnInit, OnChanges {
  @Input() model: object[];
  @Output() modelChange: EventEmitter<any> = new EventEmitter();
  listConf: object = {};
  private modelChange$: Subject<void> = new Subject();
  private destroy$: Subject<void> = new Subject();
  private itemStructure: ApiTestRest = {
    required: true,
    name: '',
    value: '',
  };
  constructor(private editService: ApiTestUtilService) {
    this.modelChange$.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      this.modelChange.emit(this.model);
    });
  }

  ngOnInit(): void {
    this.initListConf();
  }
  ngOnChanges(changes) {
    if (changes.model) {
      const currentVal = changes.model.currentValue;
      if (currentVal && (!currentVal.length || (currentVal.length && currentVal[currentVal.length - 1].name))) {
        this.model.push(Object.assign({}, this.itemStructure));
      }
    }
  }
  private initListConf() {
    this.listConf = this.editService.initListConf({
      dragCacheVar: 'DRAG_VAR_API_REST',
      itemStructure: this.itemStructure,
      watchFormLastChange: () => {
        this.modelChange$.next();
      },
    });
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

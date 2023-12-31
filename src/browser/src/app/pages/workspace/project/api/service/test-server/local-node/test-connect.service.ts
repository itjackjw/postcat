import { Injectable, Inject, LOCALE_ID } from '@angular/core';
import { toJS } from 'mobx';
import { eoDeepCopy } from 'pc/browser/src/app/shared/utils/index.utils';

import { ElectronService } from '../../../../../../../core/services';
import { ApiTestUtilService } from '../../api-test-util.service';
import { TestServerService } from '../test-server.service';
@Injectable()
export class TestServerLocalNodeService extends TestServerService {
  constructor(public electron: ElectronService, @Inject(LOCALE_ID) public locale: string, public apiTestUtil: ApiTestUtilService) {
    super(electron, locale, apiTestUtil);
  }
  init(receiveMessage: (message) => void) {
    this.electron.ipcRenderer.on('unitTest', (event, args) => {
      // console.log('[localNode]receiveMessage', args);
      receiveMessage(this.formatResponseData(args));
    });
  }
  send(module, message) {
    console.log('[localNode]send message', message);
    //!Prevent Proxy Object can't send ipcRender
    this.electron.ipcRenderer.send(module, eoDeepCopy(message));
  }
  close() {
    this.electron.ipcRenderer.removeAllListeners('unitTest');
  }
}

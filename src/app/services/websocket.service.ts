import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../environments/environment';
import { Observable, EMPTY, Subject } from 'rxjs';
import { catchError, tap, switchAll } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private messagesSubject$ = new Subject<Observable<any>>();
  public messages$ = this.messagesSubject$.pipe(switchAll(), catchError(e => { throw e }));

  constructor() {}

  public connect(): Observable<any> {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = this.getNewWebSocket();
      const messages = this.socket$.pipe(
        tap({
          error: error => console.log(error),
        }), catchError(_ => EMPTY));
      this.messagesSubject$.next(messages);
    }
    return this.messages$;
  }

  private getNewWebSocket(): WebSocketSubject<any> {
    return webSocket(`${environment.wsUrl}/ws/appointments/`);
  }

  sendMessage(msg: any) {
    if (this.socket$) {
      this.socket$.next(msg);
    } else {
      console.error('WebSocket is not connected.');
    }
  }

  close() {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}
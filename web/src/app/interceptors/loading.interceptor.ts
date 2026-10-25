import { HttpRequest, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { finalize } from 'rxjs/operators';

/**
 * Subject public pour indiquer l'état de chargement global.
 * s'abonner via: import { loading$ } from 'src/app/interceptors/loading.interceptor';
 */
export const loading$ = new Subject<boolean>();

export const loadingInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: (req: HttpRequest<any>) => Observable<HttpEvent<any>>) => {
  // Optionnel: ignorer certaines requêtes si besoin (ex: assets, ping...)
  loading$.next(true);
  return next(req).pipe(
    finalize(() => loading$.next(false))
  );
};
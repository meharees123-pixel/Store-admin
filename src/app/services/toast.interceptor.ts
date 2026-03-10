import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, tap, throwError } from 'rxjs';
import { TOAST_ERROR_MESSAGE, TOAST_SUCCESS_MESSAGE } from './http-context.tokens';
import { ToastService } from './toast.service';

export const toastInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const successMessage = req.context.get(TOAST_SUCCESS_MESSAGE);
  const errorMessage = req.context.get(TOAST_ERROR_MESSAGE);

  return next(req).pipe(
    tap((event) => {
      if (!successMessage) return;
      if (event instanceof HttpResponse) {
        toastService.success(successMessage);
      }
    }),
    catchError((err) => {
      if (errorMessage) {
        toastService.error(errorMessage);
      } else if (successMessage) {
        // If caller asked for a success toast, also surface a generic error toast on failure
        const apiMessage = err?.error?.message;
        toastService.error(apiMessage ? String(apiMessage) : 'Request failed');
      }
      return throwError(() => err);
    }),
  );
};

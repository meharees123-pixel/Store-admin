import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { SKIP_PAGE_LOADER } from './http-context.tokens';
import { LoaderService } from './loader.service';

export const loaderInterceptor: HttpInterceptorFn = (req, next) => {
  const loader = inject(LoaderService);
  const skip = req.context.get(SKIP_PAGE_LOADER);

  if (!skip) loader.show();

  return next(req).pipe(
    finalize(() => {
      if (!skip) loader.hide();
    }),
  );
};


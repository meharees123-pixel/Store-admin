import { HttpContextToken } from '@angular/common/http';

export const TOAST_SUCCESS_MESSAGE = new HttpContextToken<string | null>(() => null);
export const TOAST_ERROR_MESSAGE = new HttpContextToken<string | null>(() => null);

export const SKIP_PAGE_LOADER = new HttpContextToken<boolean>(() => false);


export interface EaxiosErrorCode {
  REQUEST_OFFLINE: string;
  REQUEST_TIMEOUT: string;
  SERVER_ERROR: string;
  RESPONSE_INVALID: string;
  [key: string]: string;
}
export declare const EAXIOS_ERROR_CODE: EaxiosErrorCode;

export interface EaxiosRequestTransformer<Data = any> {
  (data: Data, headers?: any): any;
}

export interface EaxiosResponseTransformer<Data = any> {
  (data: Data, response: EaxiosResponse<Data>): Data;
}

export interface EaxiosAdapter {
  (config: EaxiosRequestConfig): EaxiosPromise<any>;
}

export interface EaxiosBasicCredentials {
  username: string;
  password: string;
}

export interface EaxiosProxyConfig {
  host: string;
  port: number;
  auth?: {
    username: string;
    password: string;
  };
  protocol?: string;
}

export type Method =
  | 'get'
  | 'GET'
  | 'delete'
  | 'DELETE'
  | 'head'
  | 'HEAD'
  | 'options'
  | 'OPTIONS'
  | 'post'
  | 'POST'
  | 'put'
  | 'PUT'
  | 'patch'
  | 'PATCH'
  | 'link'
  | 'LINK'
  | 'unlink'
  | 'UNLINK';

export type ResponseType =
  | 'arraybuffer'
  | 'blob'
  | 'document'
  | 'json'
  | 'text'
  | 'stream';

export interface EaxiosRequestConfig<ResponseData = any, RequestData = any> {
  url?: string;
  method?: Method;
  baseURL?: string;
  transformRequest?:
    | EaxiosRequestTransformer<RequestData>
    | EaxiosRequestTransformer<RequestData>[];
  transformResponse?:
    | EaxiosResponseTransformer<ResponseData>
    | EaxiosResponseTransformer<ResponseData>[];
  headers?: any;
  params?: any;
  paramsSerializer?: (params: any) => string;
  data?: RequestData;
  timeout?: number;
  timeoutErrorMessage?: string;
  withCredentials?: boolean;
  adapter?: EaxiosAdapter;
  auth?: EaxiosBasicCredentials;
  responseError?: EaxiosErrorCode;
  responseType?: ResponseType;
  xsrfCookieName?: string;
  xsrfHeaderName?: string;
  onUploadProgress?: (progressEvent: any) => void;
  onDownloadProgress?: (progressEvent: any) => void;
  maxContentLength?: number;
  validateStatus?: (status: number) => boolean;
  maxRedirects?: number;
  socketPath?: string | null;
  httpAgent?: any;
  httpsAgent?: any;
  proxy?: EaxiosProxyConfig | false;
  cancelToken?: CancelToken;
}

export interface EaxiosResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: EaxiosRequestConfig;
  request?: any;
}

export interface EaxiosError<T = any> extends Error {
  config: EaxiosRequestConfig;
  code?: string;
  request?: any;
  response?: EaxiosResponse<T>;
  isAxiosError: boolean;
  toJSON: () => object;
}

export interface EaxiosPromise<T = any> extends Promise<T> {}

export interface CancelStatic {
  new (message?: string): Cancel;
}

export interface Cancel {
  message: string;
}

export interface Canceler {
  (message?: string): void;
}

export interface CancelTokenStatic {
  new (executor: (cancel: Canceler) => void): CancelToken;
  source(): CancelTokenSource;
}

export interface CancelToken {
  promise: Promise<Cancel>;
  reason?: Cancel;
  throwIfRequested(): void;
}

export interface CancelTokenSource {
  token: CancelToken;
  cancel: Canceler;
}

export interface EaxiosInterceptorManager<V> {
  use(
    onFulfilled?: (value: V) => V | Promise<V>,
    onRejected?: (error: any) => any,
  ): number;
  eject(id: number): void;
}

export interface EaxiosInstance {
  <ResponseData = any, RequestData = any>(
    config: EaxiosRequestConfig<ResponseData, RequestData>,
  ): EaxiosPromise<ResponseData>;
  <ResponseData = any, RequestData = any>(
    url: string,
    config?: EaxiosRequestConfig<ResponseData, RequestData>,
  ): EaxiosPromise<ResponseData>;
  defaults: EaxiosRequestConfig;
  interceptors: {
    request: EaxiosInterceptorManager<EaxiosRequestConfig>;
    response: EaxiosInterceptorManager<EaxiosResponse>;
  };
  getUri(config?: EaxiosRequestConfig): string;
  request<T = any, R = EaxiosResponse<T>>(
    config: EaxiosRequestConfig,
  ): Promise<R>;
  get<T = any, R = EaxiosResponse<T>>(
    url: string,
    config?: EaxiosRequestConfig,
  ): Promise<R>;
  delete<T = any, R = EaxiosResponse<T>>(
    url: string,
    config?: EaxiosRequestConfig,
  ): Promise<R>;
  head<T = any, R = EaxiosResponse<T>>(
    url: string,
    config?: EaxiosRequestConfig,
  ): Promise<R>;
  options<T = any, R = EaxiosResponse<T>>(
    url: string,
    config?: EaxiosRequestConfig,
  ): Promise<R>;
  post<T = any, R = EaxiosResponse<T>>(
    url: string,
    data?: any,
    config?: EaxiosRequestConfig,
  ): Promise<R>;
  put<T = any, R = EaxiosResponse<T>>(
    url: string,
    data?: any,
    config?: EaxiosRequestConfig,
  ): Promise<R>;
  patch<T = any, R = EaxiosResponse<T>>(
    url: string,
    data?: any,
    config?: EaxiosRequestConfig,
  ): Promise<R>;
}

export interface EaxiosStatic extends EaxiosInstance {
  create(config?: EaxiosRequestConfig): EaxiosInstance;
  createError(
    message: string,
    code: string,
    response: EaxiosResponse,
  ): EaxiosError;
  Cancel: CancelStatic;
  CancelToken: CancelTokenStatic;
  isCancel(value: any): boolean;
  all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

declare const Eaxios: EaxiosStatic;

export default Eaxios;

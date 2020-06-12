import axios from 'axios';
import * as Axios from 'axios';
import createError from 'axios/lib/core/createError';
import mergeConfig from 'axios/lib/core/mergeConfig';

export type AxiosAdapter = Axios.AxiosAdapter;
export type AxiosBasicCredentials = Axios.AxiosBasicCredentials;
export type AxiosProxyConfig = Axios.AxiosProxyConfig;
export type Method = Axios.Method;
export type ResponseType = Axios.ResponseType;
export type AxiosResponse<T = any> = Axios.AxiosResponse<T>;
export type AxiosError<T = any> = Axios.AxiosError<T>;
export type AxiosPromise<T = any> = Axios.AxiosPromise<T>;
export type Cancel = Axios.Cancel;
export type CancelTokenStatic = Axios.CancelTokenStatic;
export type CancelToken = Axios.CancelToken;
export type CancelTokenSource = Axios.CancelTokenSource;
export type AxiosInterceptorManager<V> = Axios.AxiosInterceptorManager<V>;

/**
 * 定制了响应值的转换
 */
export type AxiosResponseTransformer = ResponseTransformer;
export type AxiosRequestConfig = RequestConfig;
export type AxiosInstance = Instance;
export type AxiosStatic = Static;

/**
 * 增强响应值的转换器
 */
interface ResponseTransformer {
  (
    data: any,
    status: number,
    { config: RequestConfig, request: XMLHttpRequest, response: AxiosResponse },
  ): any;
}

interface RequestConfig
  extends Omit<Axios.AxiosRequestConfig, 'transformResponse'> {
  transformResponse?: ResponseTransformer | ResponseTransformer[];
}

interface Instance {
  <T = any>(config: RequestConfig): AxiosPromise<T>;
  <T = any>(url: string, config?: RequestConfig): AxiosPromise<T>;
  defaults: RequestConfig;
  interceptors: {
    request: AxiosInterceptorManager<RequestConfig>;
    response: AxiosInterceptorManager<AxiosResponse>;
  };
  getUri(config?: RequestConfig): string;
  request<T = any>(config: RequestConfig): AxiosPromise<T>;
  get<T = any>(url: string, config?: RequestConfig): AxiosPromise<T>;
  delete<T = any>(url: string, config?: RequestConfig): AxiosPromise<T>;
  head<T = any>(url: string, config?: RequestConfig): AxiosPromise<T>;
  options<T = any>(url: string, config?: RequestConfig): AxiosPromise<T>;
  post<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): AxiosPromise<T>;
  put<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): AxiosPromise<T>;
  patch<T = any>(
    url: string,
    data?: any,
    config?: RequestConfig,
  ): AxiosPromise<T>;
}

interface Static extends Instance {
  create(config?: RequestConfig): Instance;
  Cancel: Axios.CancelStatic;
  CancelToken: Axios.CancelTokenStatic;
  isCancel(value: any): boolean;
  // all<T>(values: (T | Promise<T>)[]): Promise<T[]>;
  // spread<T, R>(callback: (...args: T[]) => R): (array: T[]) => R;
}

const defaults: RequestConfig = {
  responseType: 'json',
  transformResponse: [],
  validateStatus: (status: number): boolean => status > 0 && status < 500,
};

function create(instanceConfig: RequestConfig): Instance {
  const {
    responseType: instanceResponseType,
    transformResponse: instanceTransformResponse,
    ...mergedconfig
  } = mergeConfig(defaults, instanceConfig);
  // TODO: 暂时只支持文本请求
  mergeConfig.responseType = 'text';
  mergeConfig.transformResponse = [];
  const instance = axios.create(mergedconfig);

  const eaxios = (requestConfig: RequestConfig): Axios.AxiosPromise => {
    /**
     * 将 responseType 和 transformResponse 提取出来，放在 then 中自行调用
     */
    const {
      responseType: requestResponseType,
      transformResponse: requestTransformResponse,
      ...options
    } = requestConfig;
    return instance({
      ...options,
      // TODO: 暂时只支持文本请求
      responseType: 'text',
      transformResponse: [],
      // 验证通过的状态再 then 里处理，验证不通过的状态在 catch 里处理。status 小于等于 0 时通常是指网络问题，请求被取消或者请求超时，这里强制设置为大于 0，以便将服务端返回的异常和网络异常区分开处理
      validateStatus: (status: number) => status > 0,
    })
      .then((res) => {
        const { request, config, ...response } = res;
        config.responseType = requestResponseType || instanceResponseType;
        if (response.status >= 500) {
          throw createError('系统错误了', config, 'SERVER', request, response);
        }
        let data;
        if (config.responseType === 'json') {
          try {
            data = JSON.parse(response.data);
          } catch (error) {
            // 响应解析失败
            throw createError(
              '系统出错了',
              config,
              'INVALID',
              request,
              response,
            );
          }
        }
        try {
          const tranform =
            requestTransformResponse || instanceTransformResponse;
          data = (Array.isArray(tranform) ? tranform : [tranform]).reduce(
            (rcc, transform) => {
              return transform(rcc, response.status, {
                config,
                request,
                response,
              });
            },
            data,
          );
        } catch (error) {
          // 响应转换错误
          throw createError(
            error.message,
            config,
            error.code,
            request,
            response,
          );
        }
        return data;
      })
      .catch((error) => {
        let finalError = error;
        if (error.isAxiosError) {
          if (!error.code) {
            if (error.message === 'Network Error') {
              // 网络问题
              error.code = 'OFFLINE';
            }
          } else if (
            error.code === 'ECONNABORTED' &&
            error.message.indexOf('timeout') >= 0
          ) {
            // 超时
            error.code = 'TIMEOUT';
          }
        } else if (error instanceof axios.Cancel) {
          // 取消
          finalError = createError(
            '请求被取消了',
            undefined,
            'ABORTED',
            undefined,
            undefined,
          );
        }
        throw finalError;
      });
  };

  const createMethod = (method: Axios.Method) => (
    url: string,
    config: RequestConfig,
  ): Axios.AxiosPromise =>
    eaxios({
      ...config,
      url,
      method,
    });

  Object.assign(eaxios, axios, {
    defaults: instance.defaults,
    interceptors: instance.interceptors,
    getUri: instance.getUri,
    request: axios,
    get: createMethod('get'),
    delete: createMethod('delete'),
    head: createMethod('head'),
    options: createMethod('options'),
    post: createMethod('post'),
    put: createMethod('put'),
    patch: createMethod('patch'),
  });

  return eaxios as Instance;
}

const defaultInstance: Static = create(defaults) as Static;

defaultInstance.create = create as any;
defaultInstance.Cancel = axios.Cancel;
defaultInstance.CancelToken = axios.CancelToken;
defaultInstance.isCancel = (error: Axios.AxiosError): boolean => {
  return error.code === 'ABORTED';
};

export default defaultInstance;

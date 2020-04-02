import axios, {AxiosRequestConfig, AxiosResponse} from 'axios';

const eaxios = config => {
  let canceled = false;
  const source = axios.CancelToken.source();
  const promise = instance({
    ...config,
    cancelToken: source.token
  });
  promise['cancel'] = message => {
    canceled = true;
    source.cancel(message);
  };
  return promise
    .then(({request, config, ...response}) => {
      if (response.status >= 500) {
        throw new ApiServerError({
          request,
          response,
          config
        });
      }
      try {
        const responseJSON = JSON.parse(response.data);
        const {code, message, data} = responseJSON;
        if (code !== 0) {
          throw new ApiFailureError({
            code,
            message,
            request,
            response,
            config
          });
        }
        return data;
      } catch (error) {
        throw new ApiResponseInvalidError({
          request,
          response,
          config
        });
      }
    })
    .catch(error => {
      let finalError = error;
      if (!(error instanceof ApiError)) {
        const {request, response, config} = error;
        if (
          canceled ||
          (error.code === 'ECONNABORTED' && error.message === 'Request aborted')
        ) {
          finalError = new ApiAbortError({
            message: error.message,
            request,
            response,
            config
          });
        } else if (error.message === 'Network Error') {
          finalError = new ApiNetworkError({
            request,
            response,
            config
          });
        } else if (
          error.code === 'ECONNABORTED' &&
          error.message.indexOf('timeout') >= 0
        ) {
          finalError = new ApiTimeoutError({
            request,
            response,
            config
          });
        } else {
          finalError = new ApiUnkonwError({
            original: error,
            request,
            response,
            config
          });
        }
      }
      captureApiError(finalError);
      throw finalError;
    });
};

Object.assign(eaxios, axios, {
  create: instanceConfig =>
    axios.create({
      timeout: 6000,
      responseType: 'text',
      transformResponse: [
        data => {
          return data;
        }
      ],
      validateStatus: status => {
        return status > 0;
      },
      ...instanceConfig
    })
});

export class ApiError extends Error {
  request: XMLHttpRequest;
  response: AxiosResponse;
  config: AxiosRequestConfig;

  constructor({name, message, request, response, config}) {
    super(message);
    this.name = name;
    this.request = request;
    this.response = response;
    this.config = config;
  }
}

export class ApiAbortError extends ApiError {
  constructor(options) {
    super({
      ...options,
      name: 'ApiAbortError'
    });
  }
}

export class ApiNetworkError extends ApiError {
  constructor(options) {
    super({
      ...options,
      name: 'ApiNetworkError',
      message: '网络异常。。。'
    });
  }
}

export class ApiTimeoutError extends ApiError {
  constructor(options) {
    super({
      ...options,
      name: 'ApiTimeoutError',
      message: '请求超时了。。。'
    });
  }
}

export class ApiServerError extends ApiError {
  constructor(options) {
    super({
      ...options,
      name: 'ApiServerError',
      message: '请求出错了。。。'
    });
  }
}

export class ApiResponseInvalidError extends ApiError {
  constructor(options) {
    super({
      ...options,
      name: 'ApiResponseInvalidError',
      message: '请求出错了。。。'
    });
  }
}

export class ApiFailureError extends ApiError {
  constructor(options) {
    super({
      ...options,
      name: 'ApiFailureError'
    });
  }
}

export class ApiUnkonwError extends ApiError {
  original: Error;
  constructor(options) {
    super({
      ...options,
      name: 'ApiUnkonwError',
      message: '未知错误'
    });
    this.original = options.original;
  }
}

declare var Sentry: any;

export const captureApiError = error => {
  if (Sentry) {
    if (
      error.name === 'ApiServerError' ||
      error.name === 'ApiResponseInvalidError' ||
      error.name === 'ApiUnkonwError'
    ) {
      Sentry.withScope(scope => {
        const {request = {}, response = {}, config = {}} = error;
        const url = config.url || '';
        const method = config.method || 'get';
        const status = response.status || '';
        scope.setLevel('error');
        const responseFingerprint = String(response.data).substring(0, 100);
        if (error.name === 'ApiServerError') {
          // 不能试用 URL 作为指纹，可能 URL 里带了参数，导致同一问题指纹不一致
          scope.setFingerprint(['ApiServerError', status, responseFingerprint]);
        } else if (error.name === 'ApiResponseInvalidError') {
          // 同上
          scope.setFingerprint([
            'ApiResponseInvalidError',
            responseFingerprint
          ]);
        }
        scope.setTag('api', `${method} - ${url}`);
        scope.setExtra('requestUrl', url);
        scope.setExtra('requestMethod', method);
        scope.setExtra('requestHeaders', JSON.stringify(config.headers));
        scope.setExtra('requestParams', JSON.stringify(config.params));
        scope.setExtra('requestData', JSON.stringify(config.data));
        scope.setExtra('responseStatus', response.status);
        scope.setExtra('responseText', response.data);
        if (error.original) {
          scope.setExtra('originalMessage', scope.orginal.message);
          scope.setExtra('originalStack', scope.orginal.tack);
        }
        Sentry.captureException(error);
      });
    }
  }
};

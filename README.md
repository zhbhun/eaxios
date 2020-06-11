# eaxios

[Axios](https://github.com/axios/axios) wrapper with user friendly error.

![errors.svg](errors.svg)

```ts
import axios, {
    AxiosRequestConfig,

} from 'axios';

// axios:AxiosStatic extends AxiosInstance
axios.create(config?: AxiosRequestConfig);
axios.Cancel;
axios.CancelToken;
axios.isCancel(value: any)

// AxiosInstance
axios.defaults;
axios.interceptors.request;
axios.interceptors.response;
axios.getUri


```

```js
import {CancelToken, create} from 'axios';

const axios = create({
  baseURL: 'https://xxx.com/apis/data/',
  timeout: 6000,
  responseType: 'text',
  transformResponse: [
    data => {
      return data;t
    }
  ],
  validateStatus: status => {
    return status > 0;
  }
});

export class ApiError extends Error {
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
    this.code = options.code;
  }
}

export class ApiUnkonwError extends ApiError {
  constructor(options) {
    super({
      ...options,
      name: 'ApiUnkonwError',
      message: '未知错误'
    });
    this.original = options.original;
  }
}

export const captureApiError = error => {
  if (
    error.name === 'ApiServerError' ||
    error.name === 'ApiResponseInvalidError' ||
    error.name === 'ApiUnkonwError'
  ) {
    window.Sentry.withScope(scope => {
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
        scope.setFingerprint(['ApiResponseInvalidError', responseFingerprint]);
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
      window.Sentry.captureException(error);
    });
  }
};

const request = config => {
  let canceld = false;
  const source = CancelToken.source();
  const promise = axios({
    ...config,
    cancelToken: source.token
  });
  promise.cancel = message => {
    cancel = true;
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
          canceld ||
          (error.code === 'ECONNABORTED' &&
          error.message = 'Request aborted')
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

export default request;

// ---

class XXXPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loading: false,
      failure: null,
      data: null
    };
  }

  componentDidMount() {
    this.initiate();
  }

  componentWillUnmount() {
    if (this.initiatePromise) {
      this.initiatePromise.cancel();
    }
  }

  async initiate() {
    try {
      this.setState({
        loading: true,
        error: null
      });
      const promise = request({
        method: 'get',
        url: '/xxx'
      });
      const data = await promise;
      this.setState({
        loading: false,
        data
      });
      this.initiatePromise = promise;
    } catch (error) {
      this.setState({
        loading: false,
        failure: error
      });
    } finally {
      this.initiatePromise = null;
    }
  }

  render() {
    const {loading, failure, data} = this.state;
    if (loading) {
      // 加载中动画
      return 'loading...';
    } else if (failure) {
      // 各种错误提示：网络、超时、服务器出错、业务异常等
      return failure.message;
    } else if (!data) {
      // 空数据
      return 'empty...';
    }
    // 成功
    return JSON.stringify(data);
  }
}
```

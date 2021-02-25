# eaxios

[Axios](https://github.com/axios/axios) wrapper with user friendly error.

![errors.svg](errors.svg)

## 开发背景

Axios 存在问题：

- 如果设置 Axios responseType 为 json 时，服务端返回的非 JSON 格式的响应内容会因为无法解析，response.data 为 null

    对于 500 等错误，响应内容会丢失，所以不要去配置 responseType 为 json。
    
    ps：虽然 Axios 官方文档声明 responseType 是 json，实际上底层调用 XMLHttpRequest 的 responseType 是没有传值的，应该是为了规避上一个问题。

- Axios 默认不管 HTTP 响应状态和 responseType 是什么，都会调用默认的 [transformResponse](https://github.com/axios/axios/blob/b7e954eba3911874575ed241ec2ec38ff8af21bb/lib/defaults.js#L57)

    ps：应该是为了规避上面的问题，默认提供了一个响应处理函数进行 JSON 解析，但是这会影响性能（500 等响应内容值较多时，会造成页面卡顿）。虽然 transformResponse 就转换 response，实际接收到的参数是 response.data，所以无法判断具体情况来决定是否进行解析 JSON。

- Axios then 和 catch 是根据 [validateStatus](https://github.com/axios/axios#request-config) 决定的，使用者处理以来较为麻烦。

    理想情况下，使用者希望 then 返回有效的数据，catch 返回各种错误情况：请求被取消、网络异常、网络超时、服务端异常、服务端数据格式错误、业务异常。

- Axios 默认不处理 `content-type` 为 `application/x-www-form-urlencoded` 类型的请求体，使用起来不够方便

优化方案： 

- 如果设置 Axios responseType 为 json 时，不要传给传 XMLHttpRequest，以避免非 JSON 格式的响应内容丢失
- Axios 根据响应头的 content-type 判断是否需要解析 JSON，以避免性能问题

    通过请求拦截器实现不给 Axios 传递 transformResponse 配置，且将配置备份到其他字段上，然后在响应拦截器中将响应对象 response 传递给 transformResponse 处理。响应拦截器根据 response 提供的状态码、响应头和响应内容判断是否要进行 JSON 转换。

- 取消 Axios validateStatus 的配置选项，默认所有大于 0 的状态码都是正确的状态码，然后在 Axios 拦截器 then 中进行数据解析（非 200 的可能也是 JSON，所以要复用 200 的 JSON 解析代码），并且根据异常情况抛出直观的错误对象
- 内置默认处理表单类型的请求体

代码示例：

```js
function enhanceError(error, config, code, request, response) {
  error.config = config;
  if (code) {
    error.code = code;
  
  error.request = request;
  error.response = response;
  error.isAxiosError = true  
  error.toJSON = function toJSON() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
    };
  };
  return error;
}
const AXIOS_ERROR = {
  REQUEST_OFFLINE: "REQUEST_OFFLINE",
  REQUEST_TIMEOUT: "REQUEST_TIMEOUT",
  SERVER_ERROR: "SERVER_ERROR",
  RESPONSE_INVALID: "RESPONSE_INVALID",
  // 其他业务错误码
};
axios.defaults.responseType = "json";
axios.defaults.validateStatus = function (status) {
  // 取消、网络和超时情况的响应状态码为 0，为了统一在响应拦截器 then 中调用transformResponse，这里需要将 validateStatus 设置为 status 大于 0
  return status > 0; //
};
axios.defaults.transformResponse = [
  function (data, response) {
    if (response.status > 400) {
      const error = new Error(response.data);
      error.code = response.config.responseError.SERVER_ERROR;
      throw error;
    }
    return data;
  },
];
axios.interceptors.request.use(
  function (config) {
    // TODO: 如何继承默认值配置
    config.responseError = {
      ...AXIOS_ERROR,
      ...config.responseError,
    };

    if (config.responseType === "json") {
      // 在发起请求前处理掉 json 类型的 responseType
      config._responseType = config.responseType;
      config.responseType = undefined;
      delete config.responseType;
    }

    if (config.transformResponse && config.transformResponse.length > 0) {
      // 在发起请求前处理掉 transformResponse
      config._transformResponse = config.transformResponse;
      config.transformResponse = [];
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(
  function (response) {
    // 只有 validateStatus 为 true 的状态码才会进入该函数

    if (response.config._responseType) {
      // 还原 responseType
      response.config.responseType = response.config._responseType;
      delete response.config._responseType;
    }
    if (response.config._transformResponse) {
      // 还原 transformResponse
      response.config.transformResponse =
        response.config._transformResponse;
      delete response.config._transformResponse;
    }

    if (
      (response.status >= 200 &&
        response.status < 300 &&
        response.config.responseType === "json") ||
      /^application\/json/i.test(response.headers["content-type"])
    ) {
      try {
        response.text = response.data;
        response.data = JSON.parse(response.data);
      } catch (error) {
        return Promise.reject(
          enhanceError(
            error,
            response.config,
            response.config.responseError.RESPONSE_INVALID,
            response.request,
            response
          )
        );
      }
    }

    try {
      if (
        Array.isArray(response.config.transformResponse) &&
        response.config.transformResponse.length > 0
      ) {
        return response.config.transformResponse.reduce(function (
          rcc,
          transform
        ) {
          return transform(rcc, response);
        },
        response.data);
      }
    } catch (error) {
      return Promise.reject(
        enhanceError(
          error,
          response.config,
          String(
            error.code || response.config.responseError.SERVER_ERROR
          ),
          response.request,
          response
        )
      );
    }
  },
  function (err) {
    // 取消、网络和超时等异常
    let error = err;
    if (err.isAxiosError && err.config) {
      if (!err.code && err.message === "Network Error") {
        // 网络问题
        err.code = err.config.responseError.REQUEST_OFFLINE;
      } else if (
        err.code === "ECONNABORTED" &&
        err.message.indexOf("timeout") >= 0
      ) {
        // 超时
        err.code = err.config.responseError.REQUEST_TIMEOUT;
      }
    } else if (err instanceof axios.Cancel) {
      // 取消
      error = enhanceError(
        new Error(err.message),
        undefined,
        "REQUEST_ABORTED" // TODO: 取消的网络请求无法读取配置
      );
    }
    return Promise.reject(error);
  }
);
```

## 兼容性

eaxios 依赖 URLSearchParams 处理表单类型的请求参数，不支持的环境需要引入响应的 polyfill

- [core-js](https://github.com/zloirock/core-js)

    ```js
    require("core-js/modules/web.url-search-params.js")
    ```

- [url-search-params-polyfill](https://www.npmjs.com/package/url-search-params-polyfill)

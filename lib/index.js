"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = __importDefault(require("axios"));
var createError_1 = __importDefault(require("axios/lib/core/createError"));
var mergeConfig_1 = __importDefault(require("axios/lib/core/mergeConfig"));
var defaults = {
    responseType: 'json',
    transformResponse: [],
    validateStatus: function (status) { return status > 0 && status < 500; },
};
function create(instanceConfig) {
    var _a = mergeConfig_1.default(defaults, instanceConfig), instanceResponseType = _a.responseType, instanceTransformResponse = _a.transformResponse, mergedconfig = __rest(_a, ["responseType", "transformResponse"]);
    mergeConfig_1.default.responseType = 'text';
    mergeConfig_1.default.transformResponse = [];
    var instance = axios_1.default.create(mergedconfig);
    var eaxios = function (requestConfig) {
        var requestResponseType = requestConfig.responseType, requestTransformResponse = requestConfig.transformResponse, options = __rest(requestConfig, ["responseType", "transformResponse"]);
        return instance(__assign(__assign({}, options), { responseType: 'text', transformResponse: [], validateStatus: function (status) { return status > 0; } }))
            .then(function (res) {
            var request = res.request, config = res.config, response = __rest(res, ["request", "config"]);
            config.responseType = requestResponseType || instanceResponseType;
            if (response.status >= 500) {
                throw createError_1.default('系统错误了', config, 'SERVER', request, response);
            }
            var data;
            if (config.responseType === 'json') {
                try {
                    data = JSON.parse(response.data);
                }
                catch (error) {
                    throw createError_1.default('系统出错了', config, 'INVALID', request, response);
                }
            }
            try {
                var tranform = requestTransformResponse || instanceTransformResponse;
                data = (Array.isArray(tranform) ? tranform : [tranform]).reduce(function (rcc, transform) {
                    return transform(rcc, response.status, {
                        config: config,
                        request: request,
                        response: response,
                    });
                }, data);
            }
            catch (error) {
                throw createError_1.default(error.message, config, error.code, request, response);
            }
            return data;
        })
            .catch(function (error) {
            var finalError = error;
            if (error.isAxiosError) {
                if (!error.code) {
                    if (error.message === 'Network Error') {
                        error.code = 'OFFLINE';
                    }
                }
                else if (error.code === 'ECONNABORTED' &&
                    error.message.indexOf('timeout') >= 0) {
                    error.code = 'TIMEOUT';
                }
            }
            else if (error instanceof axios_1.default.Cancel) {
                finalError = createError_1.default('请求被取消了', undefined, 'ABORTED', undefined, undefined);
            }
            throw finalError;
        });
    };
    var createMethod = function (method) { return function (url, config) {
        return eaxios(__assign(__assign({}, config), { url: url,
            method: method }));
    }; };
    Object.assign(eaxios, axios_1.default, {
        defaults: instance.defaults,
        interceptors: instance.interceptors,
        getUri: instance.getUri,
        request: axios_1.default,
        get: createMethod('get'),
        delete: createMethod('delete'),
        head: createMethod('head'),
        options: createMethod('options'),
        post: createMethod('post'),
        put: createMethod('put'),
        patch: createMethod('patch'),
    });
    return eaxios;
}
var defaultInstance = create(defaults);
defaultInstance.create = create;
defaultInstance.Cancel = axios_1.default.Cancel;
defaultInstance.CancelToken = axios_1.default.CancelToken;
defaultInstance.isCancel = function (error) {
    return error.code === 'ABORTED';
};
exports.default = defaultInstance;

import * as Axios from 'axios';
export declare type AxiosAdapter = Axios.AxiosAdapter;
export declare type AxiosBasicCredentials = Axios.AxiosBasicCredentials;
export declare type AxiosProxyConfig = Axios.AxiosProxyConfig;
export declare type Method = Axios.Method;
export declare type ResponseType = Axios.ResponseType;
export declare type AxiosResponse<T = any> = Axios.AxiosResponse<T>;
export declare type AxiosError<T = any> = Axios.AxiosError<T>;
export declare type AxiosPromise<T = any> = Axios.AxiosPromise<T>;
export declare type Cancel = Axios.Cancel;
export declare type CancelTokenStatic = Axios.CancelTokenStatic;
export declare type CancelToken = Axios.CancelToken;
export declare type CancelTokenSource = Axios.CancelTokenSource;
export declare type AxiosInterceptorManager<V> = Axios.AxiosInterceptorManager<V>;
export declare type AxiosResponseTransformer = ResponseTransformer;
export declare type AxiosRequestConfig = RequestConfig;
export declare type AxiosInstance = Instance;
export declare type AxiosStatic = Static;
interface ResponseTransformer {
    (data: any, status: number, { config: RequestConfig, request: XMLHttpRequest, response: AxiosResponse }: {
        config: any;
        request: any;
        response: any;
    }): any;
}
interface RequestConfig extends Omit<Axios.AxiosRequestConfig, 'transformResponse'> {
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
    post<T = any>(url: string, data?: any, config?: RequestConfig): AxiosPromise<T>;
    put<T = any>(url: string, data?: any, config?: RequestConfig): AxiosPromise<T>;
    patch<T = any>(url: string, data?: any, config?: RequestConfig): AxiosPromise<T>;
}
interface Static extends Instance {
    create(config?: RequestConfig): Instance;
    Cancel: Axios.CancelStatic;
    CancelToken: Axios.CancelTokenStatic;
    isCancel(value: any): boolean;
}
declare const defaultInstance: Static;
export default defaultInstance;

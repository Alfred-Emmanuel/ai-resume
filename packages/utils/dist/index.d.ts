export interface ApiClientOptions {
    baseUrl: string;
    getToken?: () => Promise<string | undefined> | string | undefined;
}
export declare function createApiClient(options: ApiClientOptions): {
    get: <T>(path: string) => Promise<T>;
    post: <T>(path: string, body?: unknown) => Promise<T>;
};
export declare function isNonEmptyString(value: unknown): value is string;
//# sourceMappingURL=index.d.ts.map
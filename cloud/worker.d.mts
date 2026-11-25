export interface KvLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}
export interface CloudEnv {
  SAVES: KvLike;
  ALLOWED_ORIGINS?: string;
}
export function handle(request: Request, env: CloudEnv, now: number): Promise<Response>;
declare const worker: { fetch(request: Request, env: CloudEnv): Promise<Response> };
export default worker;

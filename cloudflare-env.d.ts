declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    FACILITATOR_ENDPOINT?: string;
    FACILITATOR_TOKEN?: string;
  }
}

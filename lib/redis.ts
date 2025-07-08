// src/lib/redis.ts
 
import { UPSTASH_REDIS_TOKEN, UPSTASH_REDIS_URL } from "$env/static/private";
 
import { Redis } from "@upstash/redis";
 
export const databaseName =
  process.env.NODE_ENV === "development"
    ? "redis-with-svelte-kit-dev"
    : "redis-with-svelte-kit";
 

const redis = new Redis({
  url: UPSTASH_REDIS_URL,
  token: UPSTASH_REDIS_TOKEN,
});
 
export default redis;
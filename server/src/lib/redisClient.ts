import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const client = createClient({ url: REDIS_URL });
let connected = false;

client.on("error", (err) => {
  console.warn("Redis client error:", err);
});

export const connectRedis = async () => {
  if (connected) return client;
  await client.connect();
  connected = true;
  return client;
};

export const getRedis = async (key: string) => {
  await connectRedis();
  return client.get(key);
};

export const setRedis = async (key: string, value: string) => {
  await connectRedis();
  return client.set(key, value);
};

export const delRedis = async (key: string) => {
  await connectRedis();
  return client.del(key);
};

export default client;

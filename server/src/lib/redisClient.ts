import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const client = createClient({ url: REDIS_URL });
let connectPromise: Promise<void> | null = null;

client.on("error", (err) => {
  console.warn("Redis client error:", err);
});

export const connectRedis = async () => {
  if (client.isOpen) return client;
  if (connectPromise) {
    await connectPromise;
    return client;
  }
  connectPromise = client
    .connect()
    .then(() => {
      connectPromise = null;
    })
    .catch((err) => {
      connectPromise = null;
      throw err;
    });
  await connectPromise;
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

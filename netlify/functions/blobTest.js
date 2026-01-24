import { getStore } from "@netlify/blobs";

export async function handler() {
  const store = getStore("test-store");

  await store.set("hello", { message: "Blobs are working" });
  const value = await store.get("hello");

  return {
    statusCode: 200,
    body: JSON.stringify(value)
  };
}

import { getStore } from "@netlify/blobs";

export const handler = async () => {
  try {
    const store = getStore({
      name: "tech-murmurs",
      siteID: process.env.NETLIFY_SITE_ID,
      token: process.env.NETLIFY_AUTH_TOKEN
    });

    const latest = await store.get("latest");

    if (!latest) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          mode: "sample",
          ideas: []
        })
      };
    }

    // Parse and re-stringify to ensure proper format
    const parsed = typeof latest === "string" ? JSON.parse(latest) : latest;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    console.error("Latest fetch failed:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Failed to load latest ideas",
        details: err.message
      })
    };
  }
};
```

---

## **Deploy & Test:**

1. **Replace all 3 files** above
2. **Push to GitHub**
3. **Wait for deploy**
4. **Seed archive:**
```
   https://side-quest-generator.netlify.app/.netlify/functions/seedArchive
```
5. **Generate today:**
```
   https://side-quest-generator.netlify.app/.netlify/functions/generateDaily
```
6. **Open in incognito:**
```
   https://side-quest-generator.netlify.app/archive.html

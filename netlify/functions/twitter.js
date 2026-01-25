export default async () => {
  const token = process.env.X_BEARER_TOKEN;

  if (!token) {
    return Response.json(
      { error: "Missing X_BEARER_TOKEN" },
      { status: 500 }
    );
  }

  const query = [
    `"someone should build"`,
    `"wish there was"`,
    `"why is there no"`,
    `"I keep seeing people"`,
    `"feels early for"`
  ].join(" OR ");

  const url =
    "https://api.x.com/2/tweets/search/recent" +
    "?query=" + encodeURIComponent(query) +
    "&max_results=20" +
    "&tweet.fields=author_id,created_at,public_metrics" +
    "&expansions=author_id" +
    "&user.fields=username,profile_image_url";

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const json = await res.json();

    if (!json.data) {
      return Response.json([]);
    }

    const users = {};
    (json.includes?.users || []).forEach(u => {
      users[u.id] = u;
    });

    const signals = json.data
      .filter(t => {
        // discard obvious noise
        if (t.public_metrics.like_count > 500) return false;
        if (t.text.length < 40) return false;
        return true;
      })
      .map(t => {
        const user = users[t.author_id];
        return {
          type: "x",
          name: `X post by @${user?.username || "unknown"}`,
          url: `https://x.com/${user?.username}/status/${t.id}`,
          text: t.text
        };
      });

    return Response.json(signals);
  } catch (err) {
    return Response.json(
      { error: "X ingestion failed", detail: err.message },
      { status: 500 }
    );
  }
};

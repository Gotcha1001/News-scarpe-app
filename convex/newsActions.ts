// "use node";

// import { v } from "convex/values";
// import { internalAction } from "./_generated/server";
// import { internal } from "./_generated/api";
// import { stripJsonFences, NEWS_SEARCH_QUERY, MAX_ARTICLES } from "./lib";

// // ---- Tavily search -------------------------------------------------------
// interface TavilySearchResult {
//   title: string;
//   url: string;
//   content: string; // cleaned snippet
//   score?: number;
//   published_date?: string;
// }

// interface TavilySearchResponse {
//   results?: TavilySearchResult[];
//   error?: string;
// }

// // ---- Tavily extract (used per-article, just for a hero image) -----------
// interface TavilyExtractResult {
//   url: string;
//   raw_content?: string;
//   images?: string[];
// }

// interface TavilyExtractResponse {
//   results?: TavilyExtractResult[];
//   failed_results?: { url: string; error: string }[];
//   error?: string;
// }

// // ---- OpenRouter structuring step ------------------------------------------
// interface OpenRouterChatResponse {
//   choices?: { message?: { content?: string } }[];
//   error?: { message?: string; code?: number };
// }

// // Must stay in sync with newsMutations.saveArticles' `articles` validator.
// interface StructuredArticle {
//   title: string;
//   summary: string;
//   category?: string;
// }

// interface StructuredNews {
//   headline: string;
//   articles: StructuredArticle[];
// }

// const STRUCTURING_SYSTEM_PROMPT = `You are a news editor turning raw web-search snippets about today's top world news into a clean, readable digest.

// Respond with ONLY a JSON object, no markdown fences, no commentary, matching exactly this shape:
// {
//   "headline": "string -- one sentence summarizing today's overall news cycle",
//   "articles": [
//     {
//       "title": "string -- a clear, punchy headline for this story, rewritten in your own words (do not copy the source title verbatim)",
//       "summary": "string -- 2-3 sentence plain-language summary of the story",
//       "category": "string or omit -- one of: World, Politics, Business, Technology, Science, Health, Sports, Entertainment, Other"
//     }
//   ]
// }

// Rules:
// - Cover a diverse spread of major, genuinely newsworthy stories from the snippets -- avoid duplicate articles about the same event.
// - Return at most 10 articles, ordered with the most significant story first.
// - Only use facts present in the source snippets. Never invent details.
// - The "articles" array MUST correspond 1:1, in the same order, to the numbered snippets you were given: articles[0] summarizes snippet [1], articles[1] summarizes snippet [2], and so on. Skip a snippet only by omitting its entry -- never reorder.`;

// function isValidStructuredNews(x: unknown): x is StructuredNews {
//   if (!x || typeof x !== "object") return false;
//   const obj = x as Record<string, unknown>;
//   if (typeof obj.headline !== "string") return false;
//   if (!Array.isArray(obj.articles)) return false;
//   return obj.articles.every(
//     (a) =>
//       a !== null &&
//       typeof a === "object" &&
//       typeof (a as Record<string, unknown>).title === "string" &&
//       typeof (a as Record<string, unknown>).summary === "string",
//   );
// }

// export const generate = internalAction({
//   args: { runId: v.id("newsRuns") },
//   handler: async (ctx, { runId }) => {
//     try {
//       await ctx.runMutation(internal.newsMutations.markRunning, { runId });

//       const tavilyKey = process.env.TAVILY_API_KEY;
//       const openRouterKey = process.env.OPENROUTER_API_KEY;

//       if (!tavilyKey) {
//         console.error("[newsActions] TAVILY_API_KEY missing");
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: "missing_api_key",
//         });
//         return;
//       }
//       if (!openRouterKey) {
//         console.error("[newsActions] OPENROUTER_API_KEY missing");
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: "missing_api_key",
//         });
//         return;
//       }

//       // ---- Step 1: Tavily "news" search for today's top stories ---------
//       console.log("[newsActions] requesting Tavily", {
//         query: NEWS_SEARCH_QUERY,
//       });
//       const tavilyRes = await fetch("https://api.tavily.com/search", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           api_key: tavilyKey,
//           query: NEWS_SEARCH_QUERY,
//           topic: "news",
//           search_depth: "advanced",
//           days: 1,
//           include_answer: false,
//           max_results: MAX_ARTICLES,
//         }),
//       });

//       if (!tavilyRes.ok) {
//         const body = await tavilyRes.text().catch(() => "");
//         console.error(
//           "[newsActions] Tavily HTTP error",
//           tavilyRes.status,
//           body.slice(0, 500),
//         );
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: `http_${tavilyRes.status}`,
//         });
//         return;
//       }

//       const tavilyData = (await tavilyRes.json()) as TavilySearchResponse;
//       if (tavilyData.error) {
//         console.error("[newsActions] Tavily error", tavilyData.error);
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: `tavily_error: ${tavilyData.error}`,
//         });
//         return;
//       }

//       const rawResults = (tavilyData.results ?? []).slice(0, MAX_ARTICLES);
//       console.log("[newsActions] Tavily response", {
//         rawResultCount: rawResults.length,
//       });
//       if (rawResults.length === 0) {
//         console.warn("[newsActions] zero Tavily results");
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: "no_results",
//         });
//         return;
//       }

//       // ---- Step 2: OpenRouter rewrites the snippets into clean articles --
//       const snippetsForModel = rawResults
//         .map(
//           (r, i) =>
//             `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 800)}`,
//         )
//         .join("\n\n");

//       const userPrompt = `Today's raw news snippets:\n\n${snippetsForModel}`;

//       const orRes = await fetch(
//         "https://openrouter.ai/api/v1/chat/completions",
//         {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${openRouterKey}`,
//           },
//           body: JSON.stringify({
//             model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
//             messages: [
//               { role: "system", content: STRUCTURING_SYSTEM_PROMPT },
//               { role: "user", content: userPrompt },
//             ],
//           }),
//         },
//       );

//       if (!orRes.ok) {
//         const body = await orRes.text().catch(() => "");
//         console.error(
//           "[newsActions] OpenRouter HTTP error",
//           orRes.status,
//           body.slice(0, 500),
//         );
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: `http_${orRes.status}`,
//         });
//         return;
//       }

//       const orData = (await orRes.json()) as OpenRouterChatResponse;
//       if (orData.error) {
//         console.error("[newsActions] OpenRouter error payload", orData.error);
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: `openrouter_error: ${orData.error.message ?? "unknown"}`,
//         });
//         return;
//       }

//       const rawContent = orData.choices?.[0]?.message?.content?.trim() ?? "";
//       if (!rawContent) {
//         console.error("[newsActions] OpenRouter returned empty content");
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: "structuring_failed",
//         });
//         return;
//       }

//       // ---- Step 3: parse + validate the structured JSON -------------------
//       const jsonText = stripJsonFences(rawContent);
//       let parsed: unknown;
//       try {
//         parsed = JSON.parse(jsonText);
//       } catch (e) {
//         console.error(
//           "[newsActions] failed to parse structured JSON",
//           e,
//           jsonText.slice(0, 500),
//         );
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: "structuring_failed",
//         });
//         return;
//       }

//       if (!isValidStructuredNews(parsed)) {
//         console.error(
//           "[newsActions] structured JSON failed shape check",
//           jsonText.slice(0, 500),
//         );
//         await ctx.runMutation(internal.newsMutations.markFailed, {
//           runId,
//           reason: "structuring_failed",
//         });
//         return;
//       }

//       const structured: StructuredNews = parsed;
//       const trimmedArticles = structured.articles.slice(0, rawResults.length);

//       // ---- Step 4: best-effort hero image per article via Tavily extract -
//       // Sources/URLs always come from the raw Tavily hits (never from the
//       // model) so every card links to a real page even if the model
//       // paraphrased the title heavily.
//       const imageResults = await Promise.allSettled(
//         rawResults
//           .slice(0, trimmedArticles.length)
//           .map((r) => fetchArticleImage(tavilyKey, r.url)),
//       );

//       const finalArticles = trimmedArticles.map((article, i) => {
//         const source = rawResults[i];
//         const imageOutcome = imageResults[i];
//         const imageUrl =
//           imageOutcome && imageOutcome.status === "fulfilled"
//             ? imageOutcome.value
//             : undefined;
//         return {
//           title: article.title,
//           url: source.url,
//           summary: article.summary,
//           category: article.category,
//           publishedDate: source.published_date,
//           source: safeHostname(source.url),
//           imageUrl,
//         };
//       });

//       // ---- Step 5: save ----------------------------------------------------
//       await ctx.runMutation(internal.newsMutations.saveArticles, {
//         runId,
//         summary: structured.headline,
//         articles: finalArticles,
//       });
//     } catch (e) {
//       console.error("[newsActions] unhandled exception in generate()", e);
//       await ctx.runMutation(internal.newsMutations.markFailed, {
//         runId,
//         reason: "exception",
//       });
//     }
//   },
// });

// /**
//  * Best-effort hero image for a single article via Tavily's /extract
//  * endpoint. Never throws -- returns undefined if nothing usable was
//  * found, and the UI falls back to a text-only card in that case.
//  */
// async function fetchArticleImage(
//   tavilyKey: string,
//   url: string,
// ): Promise<string | undefined> {
//   try {
//     const res = await fetch("https://api.tavily.com/extract", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         api_key: tavilyKey,
//         urls: [url],
//         include_images: true,
//       }),
//     });
//     if (!res.ok) return undefined;
//     const data = (await res.json()) as TavilyExtractResponse;
//     const image = data.results?.[0]?.images?.[0];
//     return typeof image === "string" && image.length > 0 ? image : undefined;
//   } catch (e) {
//     console.warn("[newsActions] image extract failed for", url, e);
//     return undefined;
//   }
// }

// function safeHostname(url: string): string | undefined {
//   try {
//     return new URL(url).hostname.replace(/^www\./, "");
//   } catch {
//     return undefined;
//   }
// }
// convex/newsActions.ts
"use node";

// Pipeline for one "generate today's news" run:
//
//   1. PICK the top 10 world stories  -> SerpApi's Google News API, "World"
//      topic (1 search). Google already groups coverage into one cluster per
//      event, so we get 10 distinct stories, each with a lead headline, a
//      publisher thumbnail and the headlines other outlets ran on it.
//      Fallback: the old Tavily "news" search if SerpApi is missing/fails.
//   2. READ the lead articles         -> Tavily /extract, ONE batched call
//      for all 10 URLs (best effort; also fills any missing pictures).
//   3. WRITE the digest               -> OpenRouter rewrites each story into a
//      clean title + 2-3 sentence summary and tags a category.
//   4. SAVE                           -> newsMutations.saveArticles.
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { stripJsonFences, NEWS_SEARCH_QUERY, MAX_ARTICLES } from "./lib";

// ---- Config --------------------------------------------------------------

/** Google News "World" topic (US English edition). Override per deployment
 *  with `npx convex env set SERPAPI_NEWS_TOPIC_TOKEN <token>` -- e.g. the
 *  "Top stories" token CAAqJggKIiBDQkFTRWdvSUwyMHZNRFZxYUdjU0FtVnVHZ0pWVXlnQVAB. */
const GOOGLE_NEWS_WORLD_TOPIC_TOKEN =
  "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx1YlY4U0FtVnVHZ0pWVXlnQVAB";
const SERP_GL = "us";
const SERP_HL = "en";

const NEWS_MODEL = "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free";

/** Keep each provider call well inside the 3-minute "stale run" window. */
const SERPAPI_TIMEOUT_MS = 20_000;
const TAVILY_SEARCH_TIMEOUT_MS = 25_000;
const TAVILY_EXTRACT_TIMEOUT_MS = 30_000;

const EXCERPT_MAX_CHARS = 1_200;
const MAX_RELATED_HEADLINES = 4;

// ---- Shared internal shape ----------------------------------------------

/** One story going into the editor step, whichever provider found it. */
interface Candidate {
  title: string;
  url: string;
  sourceName?: string;
  publishedDate?: string;
  imageUrl?: string;
  /** Headlines other outlets ran on the same story (Google News clusters). */
  context: string[];
  /** Cleaned text from the article itself (Tavily). */
  excerpt?: string;
}

// ---- SerpApi Google News -------------------------------------------------

interface SerpNewsItem {
  title?: string;
  link?: string;
  snippet?: string;
  thumbnail?: string;
  thumbnail_small?: string;
  iso_date?: string;
  video?: boolean;
  source?: { name?: string };
}

/** A cluster: `highlight` is the lead article, `stories` are other outlets. */
interface SerpNewsResult extends SerpNewsItem {
  highlight?: SerpNewsItem;
  stories?: SerpNewsItem[];
}

interface SerpNewsResponse {
  news_results?: SerpNewsResult[];
  error?: string;
}

// ---- Tavily --------------------------------------------------------------

interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  published_date?: string;
}

interface TavilySearchResponse {
  results?: TavilySearchResult[];
  error?: string;
}

interface TavilyExtractResult {
  url: string;
  raw_content?: string;
  images?: string[];
}

interface TavilyExtractResponse {
  results?: TavilyExtractResult[];
  failed_results?: { url: string; error: string }[];
  error?: string;
}

// ---- OpenRouter ----------------------------------------------------------

interface OpenRouterChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string; code?: number };
}

interface StructuredArticle {
  /** 1-based number of the story this entry rewrites (the [n] in the prompt). */
  sourceIndex: number;
  title: string;
  summary: string;
  category?: string;
}

interface StructuredNews {
  headline: string;
  articles: StructuredArticle[];
}

const STRUCTURING_SYSTEM_PROMPT = `You are a news editor building a "top world stories today" digest.
You are given numbered stories. Each story is ONE distinct event, shown with the lead headline, sometimes headlines other outlets ran on the same event, and sometimes an excerpt from the lead article.
Respond with ONLY a JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "headline": "string -- one sentence summarizing today's overall news cycle",
  "articles": [
    {
      "sourceIndex": 1,
      "title": "string -- a clear, punchy headline for this story, in your own words (do not copy a source headline verbatim)",
      "summary": "string -- 2-3 sentence plain-language summary of the story",
      "category": "string or omit -- one of: World, Politics, Business, Technology, Science, Health, Sports, Entertainment, Other"
    }
  ]
}
Rules:
- Return exactly one entry for EVERY numbered story, in the same order. "sourceIndex" is that story's number in [brackets]. Never merge, reorder or skip stories.
- Only use facts present in that story's headlines and excerpt. Never invent details.
- If there is no excerpt, or the excerpt is a cookie notice, paywall or navigation text, rely on the headlines and keep the summary general.`;

function isValidStructuredNews(x: unknown): x is StructuredNews {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  if (typeof obj.headline !== "string") return false;
  if (!Array.isArray(obj.articles)) return false;
  return obj.articles.every((a) => {
    if (a === null || typeof a !== "object") return false;
    const entry = a as Record<string, unknown>;
    return (
      typeof entry.sourceIndex === "number" &&
      Number.isInteger(entry.sourceIndex) &&
      typeof entry.title === "string" &&
      typeof entry.summary === "string" &&
      (entry.category === undefined || typeof entry.category === "string")
    );
  });
}

// ---- The action ----------------------------------------------------------

export const generate = internalAction({
  args: { runId: v.id("newsRuns") },
  handler: async (ctx, { runId }): Promise<void> => {
    try {
      await ctx.runMutation(internal.newsMutations.markRunning, { runId });

      const serpKey = process.env.SERPAPI_API_KEY;
      const tavilyKey = process.env.TAVILY_API_KEY;
      const openRouterKey = process.env.OPENROUTER_API_KEY;

      // OpenRouter is always needed; we need at least one way to find news.
      if (!openRouterKey || (!serpKey && !tavilyKey)) {
        console.error("[newsActions] missing API keys", {
          hasSerpApi: Boolean(serpKey),
          hasTavily: Boolean(tavilyKey),
          hasOpenRouter: Boolean(openRouterKey),
        });
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "missing_api_key",
        });
        return;
      }

      // ---- Step 1: pick the top stories -------------------------------
      let candidates: Candidate[] = [];
      if (serpKey) {
        candidates = await fetchGoogleNewsCandidates(serpKey);
      }
      if (candidates.length === 0 && tavilyKey) {
        console.warn("[newsActions] falling back to Tavily news search");
        candidates = await fetchTavilyCandidates(tavilyKey);
      }
      candidates = candidates.slice(0, MAX_ARTICLES);

      if (candidates.length === 0) {
        console.warn("[newsActions] no candidate stories from any provider");
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "no_results",
        });
        return;
      }
      console.log("[newsActions] candidates", { count: candidates.length });

      // ---- Step 2: read the lead articles (best effort) ---------------
      if (tavilyKey) {
        candidates = await enrichCandidates(tavilyKey, candidates);
      }

      // ---- Step 3: OpenRouter writes the digest ------------------------
      const storiesForModel = candidates.map(buildStoryBlock).join("\n\n");
      const orRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: NEWS_MODEL,
            messages: [
              { role: "system", content: STRUCTURING_SYSTEM_PROMPT },
              {
                role: "user",
                content: `Today's top stories:\n\n${storiesForModel}`,
              },
            ],
          }),
        },
      );

      if (!orRes.ok) {
        const body = await orRes.text().catch(() => "");
        console.error(
          "[newsActions] OpenRouter HTTP error",
          orRes.status,
          body.slice(0, 500),
        );
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: `http_${orRes.status}`,
        });
        return;
      }

      const orData = (await orRes.json()) as OpenRouterChatResponse;
      if (orData.error) {
        console.error("[newsActions] OpenRouter error payload", orData.error);
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: `openrouter_error: ${orData.error.message ?? "unknown"}`,
        });
        return;
      }

      const rawContent = orData.choices?.[0]?.message?.content?.trim() ?? "";
      if (!rawContent) {
        console.error("[newsActions] OpenRouter returned empty content");
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "structuring_failed",
        });
        return;
      }

      // ---- Step 4: parse + validate ------------------------------------
      const jsonText = stripJsonFences(rawContent);
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonText);
      } catch (e) {
        console.error(
          "[newsActions] failed to parse structured JSON",
          e,
          jsonText.slice(0, 500),
        );
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "structuring_failed",
        });
        return;
      }
      if (!isValidStructuredNews(parsed)) {
        console.error(
          "[newsActions] structured JSON failed shape check",
          jsonText.slice(0, 500),
        );
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "structuring_failed",
        });
        return;
      }
      const structured: StructuredNews = parsed;

      // URL, source, date and picture always come from the real candidate
      // (matched by sourceIndex, never by array position), so a skipped or
      // reordered entry from the model can't attach the wrong link.
      const usedIndexes = new Set<number>();
      const finalArticles = structured.articles
        .slice()
        .sort((a, b) => a.sourceIndex - b.sourceIndex)
        .flatMap((article) => {
          const index = article.sourceIndex - 1;
          const candidate = candidates[index];
          if (!candidate || usedIndexes.has(index)) return [];
          usedIndexes.add(index);
          return [
            {
              title: article.title,
              url: candidate.url,
              summary: article.summary,
              category: article.category,
              publishedDate: candidate.publishedDate,
              source: candidate.sourceName ?? safeHostname(candidate.url),
              imageUrl: candidate.imageUrl,
            },
          ];
        });

      if (finalArticles.length === 0) {
        console.error("[newsActions] no usable articles after matching");
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "structuring_failed",
        });
        return;
      }

      // ---- Step 5: save --------------------------------------------------
      await ctx.runMutation(internal.newsMutations.saveArticles, {
        runId,
        summary: structured.headline,
        articles: finalArticles,
      });
    } catch (e) {
      console.error("[newsActions] unhandled exception in generate()", e);
      await ctx.runMutation(internal.newsMutations.markFailed, {
        runId,
        reason: "exception",
      });
    }
  },
});

// ---- Step 1a: Google News via SerpApi ------------------------------------

/** Never throws -- returns [] (after logging) so the caller can fall back. */
async function fetchGoogleNewsCandidates(
  serpKey: string,
): Promise<Candidate[]> {
  const params = new URLSearchParams({
    engine: "google_news",
    gl: SERP_GL,
    hl: SERP_HL,
    topic_token:
      process.env.SERPAPI_NEWS_TOPIC_TOKEN ?? GOOGLE_NEWS_WORLD_TOPIC_TOKEN,
    api_key: serpKey,
  });
  try {
    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: AbortSignal.timeout(SERPAPI_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "[newsActions] SerpApi HTTP error",
        res.status,
        body.slice(0, 300),
      );
      return [];
    }
    const data = (await res.json()) as SerpNewsResponse;
    if (data.error) {
      console.error("[newsActions] SerpApi error", data.error);
      return [];
    }
    return serpResultsToCandidates(data.news_results ?? []);
  } catch (e) {
    console.error("[newsActions] SerpApi request failed", e);
    return [];
  }
}

function serpResultsToCandidates(results: SerpNewsResult[]): Candidate[] {
  const candidates: Candidate[] = [];
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();

  const push = (lead: SerpNewsItem, related: SerpNewsItem[]) => {
    // Prefer a non-video lead; Google sometimes leads a cluster with a video.
    const pool = [lead, ...related];
    const chosen =
      pool.find((item) => item.title && item.link && !item.video) ?? lead;
    if (!chosen.title || !chosen.link) return;

    const titleKey = chosen.title.trim().toLowerCase();
    if (seenUrls.has(chosen.link) || seenTitles.has(titleKey)) return;
    seenUrls.add(chosen.link);
    seenTitles.add(titleKey);

    // Prefer the lead's picture, then any other outlet's on the same story.
    // (`thumbnail_small` is a blurry Google-hosted copy, so it is skipped.)
    const imageUrl = [chosen, ...pool].find(
      (item) => item.thumbnail,
    )?.thumbnail;

    const context = pool
      .filter((item) => item !== chosen && item.title)
      .slice(0, MAX_RELATED_HEADLINES)
      .map((item) =>
        item.source?.name
          ? `${item.title} (${item.source.name})`
          : `${item.title}`,
      );

    candidates.push({
      title: chosen.title,
      url: chosen.link,
      sourceName: chosen.source?.name,
      publishedDate: chosen.iso_date,
      imageUrl,
      context,
      excerpt: chosen.snippet,
    });
  };

  for (const result of results) {
    const lead =
      result.highlight ?? (result.title && result.link ? result : undefined);
    const related = result.stories ?? [];
    if (lead) {
      push(lead, related);
    } else {
      // A section header ("Top news") that only wraps a list of stories.
      for (const story of related) push(story, []);
    }
  }
  return candidates;
}

// ---- Step 1b (fallback): Tavily news search ------------------------------

/** Never throws -- returns [] (after logging) on any failure. */
async function fetchTavilyCandidates(tavilyKey: string): Promise<Candidate[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: NEWS_SEARCH_QUERY,
        topic: "news",
        search_depth: "advanced",
        days: 1,
        include_answer: false,
        max_results: MAX_ARTICLES,
      }),
      signal: AbortSignal.timeout(TAVILY_SEARCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        "[newsActions] Tavily HTTP error",
        res.status,
        body.slice(0, 300),
      );
      return [];
    }
    const data = (await res.json()) as TavilySearchResponse;
    if (data.error) {
      console.error("[newsActions] Tavily error", data.error);
      return [];
    }
    return (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      sourceName: safeHostname(r.url),
      publishedDate: r.published_date,
      context: [],
      excerpt: r.content.slice(0, EXCERPT_MAX_CHARS),
    }));
  } catch (e) {
    console.error("[newsActions] Tavily search failed", e);
    return [];
  }
}

// ---- Step 2: read the lead articles --------------------------------------

/**
 * ONE batched Tavily /extract call for every lead URL (basic depth bills per
 * 5 successful URLs, so ~2 credits for 10 stories -- versus one call per
 * article before). Adds a cleaned excerpt for the editor model and, when
 * the provider gave no picture, the article's first image. Never throws.
 */
async function enrichCandidates(
  tavilyKey: string,
  candidates: Candidate[],
): Promise<Candidate[]> {
  const needsImages = candidates.some((c) => !c.imageUrl);
  try {
    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        urls: candidates.map((c) => c.url),
        extract_depth: "basic",
        include_images: needsImages,
      }),
      signal: AbortSignal.timeout(TAVILY_EXTRACT_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn("[newsActions] Tavily extract HTTP", res.status);
      return candidates;
    }
    const data = (await res.json()) as TavilyExtractResponse;
    const byUrl = new Map<string, TavilyExtractResult>();
    for (const r of data.results ?? []) byUrl.set(normalizeUrl(r.url), r);

    return candidates.map((candidate) => {
      const extracted = byUrl.get(normalizeUrl(candidate.url));
      if (!extracted) return candidate;
      const cleaned = extracted.raw_content
        ? cleanArticleText(extracted.raw_content)
        : "";
      const firstImage = extracted.images?.find((img) => img.length > 0);
      return {
        ...candidate,
        excerpt: cleaned.length > 0 ? cleaned : candidate.excerpt,
        imageUrl: candidate.imageUrl ?? firstImage,
      };
    });
  } catch (e) {
    console.warn("[newsActions] Tavily extract failed", e);
    return candidates;
  }
}

/** Drops links/images and short nav-style lines, keeps paragraph text. */
function cleanArticleText(raw: string): string {
  return raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 60)
    .join(" ")
    .replace(/\s+/g, " ")
    .slice(0, EXCERPT_MAX_CHARS);
}

// ---- Helpers -------------------------------------------------------------

function buildStoryBlock(candidate: Candidate, index: number): string {
  const lines = [
    `[${index + 1}] ${candidate.title}`,
    `Source: ${candidate.sourceName ?? safeHostname(candidate.url) ?? "unknown"}`,
  ];
  if (candidate.context.length > 0) {
    lines.push(
      "Other headlines on this story:",
      ...candidate.context.map((headline) => `- ${headline}`),
    );
  }
  if (candidate.excerpt) {
    lines.push(`Article excerpt: ${candidate.excerpt}`);
  }
  return lines.join("\n");
}

function normalizeUrl(url: string): string {
  return url.split("#")[0].replace(/\/+$/, "");
}

function safeHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

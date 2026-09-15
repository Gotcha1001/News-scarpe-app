"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { stripJsonFences, NEWS_SEARCH_QUERY, MAX_ARTICLES } from "./lib";

// ---- Tavily search -------------------------------------------------------
interface TavilySearchResult {
  title: string;
  url: string;
  content: string; // cleaned snippet
  score?: number;
  published_date?: string;
}

interface TavilySearchResponse {
  results?: TavilySearchResult[];
  error?: string;
}

// ---- Tavily extract (used per-article, just for a hero image) -----------
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

// ---- OpenRouter structuring step ------------------------------------------
interface OpenRouterChatResponse {
  choices?: { message?: { content?: string } }[];
  error?: { message?: string; code?: number };
}

// Must stay in sync with newsMutations.saveArticles' `articles` validator.
interface StructuredArticle {
  title: string;
  summary: string;
  category?: string;
}

interface StructuredNews {
  headline: string;
  articles: StructuredArticle[];
}

const STRUCTURING_SYSTEM_PROMPT = `You are a news editor turning raw web-search snippets about today's top world news into a clean, readable digest.

Respond with ONLY a JSON object, no markdown fences, no commentary, matching exactly this shape:
{
  "headline": "string -- one sentence summarizing today's overall news cycle",
  "articles": [
    {
      "title": "string -- a clear, punchy headline for this story, rewritten in your own words (do not copy the source title verbatim)",
      "summary": "string -- 2-3 sentence plain-language summary of the story",
      "category": "string or omit -- one of: World, Politics, Business, Technology, Science, Health, Sports, Entertainment, Other"
    }
  ]
}

Rules:
- Cover a diverse spread of major, genuinely newsworthy stories from the snippets -- avoid duplicate articles about the same event.
- Return at most 10 articles, ordered with the most significant story first.
- Only use facts present in the source snippets. Never invent details.
- The "articles" array MUST correspond 1:1, in the same order, to the numbered snippets you were given: articles[0] summarizes snippet [1], articles[1] summarizes snippet [2], and so on. Skip a snippet only by omitting its entry -- never reorder.`;

function isValidStructuredNews(x: unknown): x is StructuredNews {
  if (!x || typeof x !== "object") return false;
  const obj = x as Record<string, unknown>;
  if (typeof obj.headline !== "string") return false;
  if (!Array.isArray(obj.articles)) return false;
  return obj.articles.every(
    (a) =>
      a !== null &&
      typeof a === "object" &&
      typeof (a as Record<string, unknown>).title === "string" &&
      typeof (a as Record<string, unknown>).summary === "string",
  );
}

export const generate = internalAction({
  args: { runId: v.id("newsRuns") },
  handler: async (ctx, { runId }) => {
    try {
      await ctx.runMutation(internal.newsMutations.markRunning, { runId });

      const tavilyKey = process.env.TAVILY_API_KEY;
      const openRouterKey = process.env.OPENROUTER_API_KEY;

      if (!tavilyKey) {
        console.error("[newsActions] TAVILY_API_KEY missing");
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "missing_api_key",
        });
        return;
      }
      if (!openRouterKey) {
        console.error("[newsActions] OPENROUTER_API_KEY missing");
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "missing_api_key",
        });
        return;
      }

      // ---- Step 1: Tavily "news" search for today's top stories ---------
      console.log("[newsActions] requesting Tavily", {
        query: NEWS_SEARCH_QUERY,
      });
      const tavilyRes = await fetch("https://api.tavily.com/search", {
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
      });

      if (!tavilyRes.ok) {
        const body = await tavilyRes.text().catch(() => "");
        console.error(
          "[newsActions] Tavily HTTP error",
          tavilyRes.status,
          body.slice(0, 500),
        );
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: `http_${tavilyRes.status}`,
        });
        return;
      }

      const tavilyData = (await tavilyRes.json()) as TavilySearchResponse;
      if (tavilyData.error) {
        console.error("[newsActions] Tavily error", tavilyData.error);
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: `tavily_error: ${tavilyData.error}`,
        });
        return;
      }

      const rawResults = (tavilyData.results ?? []).slice(0, MAX_ARTICLES);
      console.log("[newsActions] Tavily response", {
        rawResultCount: rawResults.length,
      });
      if (rawResults.length === 0) {
        console.warn("[newsActions] zero Tavily results");
        await ctx.runMutation(internal.newsMutations.markFailed, {
          runId,
          reason: "no_results",
        });
        return;
      }

      // ---- Step 2: OpenRouter rewrites the snippets into clean articles --
      const snippetsForModel = rawResults
        .map(
          (r, i) =>
            `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 800)}`,
        )
        .join("\n\n");

      const userPrompt = `Today's raw news snippets:\n\n${snippetsForModel}`;

      const orRes = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openRouterKey}`,
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            messages: [
              { role: "system", content: STRUCTURING_SYSTEM_PROMPT },
              { role: "user", content: userPrompt },
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

      // ---- Step 3: parse + validate the structured JSON -------------------
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
      const trimmedArticles = structured.articles.slice(0, rawResults.length);

      // ---- Step 4: best-effort hero image per article via Tavily extract -
      // Sources/URLs always come from the raw Tavily hits (never from the
      // model) so every card links to a real page even if the model
      // paraphrased the title heavily.
      const imageResults = await Promise.allSettled(
        rawResults
          .slice(0, trimmedArticles.length)
          .map((r) => fetchArticleImage(tavilyKey, r.url)),
      );

      const finalArticles = trimmedArticles.map((article, i) => {
        const source = rawResults[i];
        const imageOutcome = imageResults[i];
        const imageUrl =
          imageOutcome && imageOutcome.status === "fulfilled"
            ? imageOutcome.value
            : undefined;
        return {
          title: article.title,
          url: source.url,
          summary: article.summary,
          category: article.category,
          publishedDate: source.published_date,
          source: safeHostname(source.url),
          imageUrl,
        };
      });

      // ---- Step 5: save ----------------------------------------------------
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

/**
 * Best-effort hero image for a single article via Tavily's /extract
 * endpoint. Never throws -- returns undefined if nothing usable was
 * found, and the UI falls back to a text-only card in that case.
 */
async function fetchArticleImage(
  tavilyKey: string,
  url: string,
): Promise<string | undefined> {
  try {
    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        urls: [url],
        include_images: true,
      }),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as TavilyExtractResponse;
    const image = data.results?.[0]?.images?.[0];
    return typeof image === "string" && image.length > 0 ? image : undefined;
  } catch (e) {
    console.warn("[newsActions] image extract failed for", url, e);
    return undefined;
  }
}

function safeHostname(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return undefined;
  }
}

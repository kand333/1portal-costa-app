import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TopBar } from "./top-bar";

const ufReply = (valor: unknown) => vi.fn(() => Promise.resolve(new Response(JSON.stringify({ serie: [{ valor }] }), { status: 200 })));

async function renderTopBar() {
  return renderToStaticMarkup(await TopBar());
}

describe("TopBar", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "56920593331");
    vi.stubEnv("NEXT_PUBLIC_FACEBOOK_URL", "");
    vi.stubEnv("NEXT_PUBLIC_YOUTUBE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_INSTAGRAM_URL", "");
    vi.stubGlobal("fetch", ufReply(41269.4));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("shows the email, the WhatsApp number and today's UF", async () => {
    const html = await renderTopBar();
    expect(html).toContain('href="mailto:propizoom@gmail.com"');
    expect(html).toContain("propizoom@gmail.com");
    expect(html).toContain("+56 9 2059 3331");
    expect(html).toContain('href="https://wa.me/56920593331?');
    expect(html).toContain("UF $41.269");
  });

  it("is hidden on phones and shown from 640 px up", async () => {
    expect(await renderTopBar()).toMatch(/class="[^"]*\bhidden\b[^"]*\bsm:block\b/);
  });

  it("shows no social icon, and no broken link, until its URL is configured", async () => {
    expect(await renderTopBar()).not.toMatch(/facebook|youtube|instagram/i);
    vi.stubEnv("NEXT_PUBLIC_INSTAGRAM_URL", "https://www.instagram.com/propizoom");
    const html = await renderTopBar();
    expect(html).toContain('href="https://www.instagram.com/propizoom"');
    expect(html).toContain('aria-label="Instagram"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).not.toMatch(/facebook|youtube/i);
  });

  it("omits the UF when the quote cannot be fetched and the phone when there is no number", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("down"))));
    vi.stubEnv("NEXT_PUBLIC_WHATSAPP_NUMBER", "");
    const html = await renderTopBar();
    expect(html).not.toContain("UF $");
    expect(html).not.toContain("wa.me");
    expect(html).toContain("mailto:propizoom@gmail.com");
  });
});

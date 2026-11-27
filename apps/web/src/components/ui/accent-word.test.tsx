import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccentWord } from "./accent-word";

describe("AccentWord", () => {
  it("is an italic, orange key word by default", () => {
    expect(renderToStaticMarkup(<AccentWord>destacados</AccentWord>)).toBe('<em class="display-accent">destacados</em>');
  });

  it("can be italic only, for headlines on a blue background", () => {
    expect(renderToStaticMarkup(<AccentWord plain>necesitas</AccentWord>)).toBe('<em class="display-accent-plain">necesitas</em>');
  });
});

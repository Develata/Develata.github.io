/** Journal MathML: compile TeX once with a bounded cache, no SVG path expansion.
 * Other pages retain the existing MathJax SVG renderer. MathML is native in modern
 * browsers and keeps the full-history RSS and static page bundles small.
 */
import mathjaxPlugin from 'markdown-it-mathjax3';
import { mathjax } from 'mathjax-full/js/mathjax.js';
import { TeX } from 'mathjax-full/js/input/tex.js';
import { SVG } from 'mathjax-full/js/output/svg.js';
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js';
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js';
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js';
import { SerializedMmlVisitor } from 'mathjax-full/js/core/MmlTree/SerializedMmlVisitor.js';
import { STATE } from 'mathjax-full/js/core/MathItem.js';
import type MarkdownIt from 'markdown-it';
const adaptor = liteAdaptor();
RegisterHTMLHandler(adaptor);
const document = mathjax.document('', {
  InputJax: new TeX({ packages: AllPackages }),
  OutputJax: new SVG({ fontCache: 'none' }),
});
const cache = new Map<string, string>();
const visitor = new SerializedMmlVisitor();
export function boundedMath(md: MarkdownIt, options: { native?: boolean } = {}) {
  md.use(mathjaxPlugin);
  for (const [rule, display] of [['math_inline', false], ['math_block', true]] as const) {
    const original = md.renderer.rules[rule]!;
    md.renderer.rules[rule] = (tokens, idx, renderOptions, env, self) => {
      const native = options.native || String(env?.relativePath || env?.path || '').includes('daily/math/');
      if (!native) return original(tokens, idx, renderOptions, env, self);
      const tex = tokens[idx].content;
      const key = `${display}:${tex}`;
      const cached = cache.get(key);
      if (cached) return cached;
      document.inputJax[0].reset();
      const mml = visitor.visitTree(document.convert(tex, { display, end: STATE.COMPILED }));
      const html = display ? `<div style="overflow-x:auto;margin:1em 0">${mml}</div>` : mml;
      if (cache.size >= 256) cache.delete(cache.keys().next().value!);
      cache.set(key, html);
      return html;
    };
  }
}

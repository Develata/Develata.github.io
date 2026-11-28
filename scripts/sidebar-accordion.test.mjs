import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { parse, compileScript } from '@vue/compiler-sfc';
import { transformSync } from 'esbuild';
import { createRenderer, h, nextTick } from 'vue';

// Exercise the actual SFC setup/watchers and template events without a DOM dependency.
const modules = new Map();
function loadModule(url) {
  if (modules.has(url.href)) return modules.get(url.href);
  let source = readFileSync(url, 'utf8');
  if (url.pathname.endsWith('.vue')) {
    const { descriptor } = parse(source, { filename: fileURLToPath(url) });
    source = compileScript(descriptor, { id: url.pathname, inlineTemplate: true }).content;
  }
  source = transformSync(source, { loader: 'ts', format: 'esm' }).code;
  source = source.replace(/from\s+["']([^"']+)["']/gu, (_, specifier) => {
    let target;
    if (specifier === 'vitepress/theme') {
      target = 'data:text/javascript,' + encodeURIComponent('export const VPLink = "a";');
    } else if (specifier === 'vitepress') {
      target = 'data:text/javascript,' + encodeURIComponent('export const useRoute = () => ({path: "/knowledge/math/"});');
    } else if (specifier.startsWith('.')) {
      target = loadModule(new URL(/\.(vue|ts)$/u.test(specifier) ? specifier : `${specifier}.ts`, url));
    } else target = import.meta.resolve(specifier);
    return `from ${JSON.stringify(target)}`;
  });
  const target = 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
  modules.set(url.href, target);
  return target;
}
const { default: Group } = await import(loadModule(new URL('../docs/.vitepress/theme/components/DailySidebarGroup.vue', import.meta.url)));
const { useDefaultSidebarControl } = await import(loadModule(new URL('../docs/.vitepress/theme/sidebar/defaultSidebarControl.ts', import.meta.url)));
const { computed, effectScope } = await import('vue');
test('ordinary Math siblings keep independent default collapse state', () => {
  const scope = effectScope();
  scope.run(() => {
    const a = useDefaultSidebarControl(computed(() => ({ text: 'A', collapsed: true, items: [{ text: 'a', link: '/a' }] })));
    const b = useDefaultSidebarControl(computed(() => ({ text: 'B', collapsed: true, items: [{ text: 'b', link: '/b' }] })));
    a.toggle(); b.toggle();
    assert.equal(a.collapsed.value, false); assert.equal(b.collapsed.value, false);
    a.toggle(); assert.equal(b.collapsed.value, false);
  });
  scope.stop();
});
const node = (type, text = '') => ({ type, text, props: {}, children: [], parent: null });
const renderer = createRenderer({
  createElement: node, createText: text => node('#text', text), createComment: text => node('#comment', text),
  setText: (el, text) => { el.text = text; }, setElementText: (el, text) => { el.text = text; el.children = []; },
  patchProp: (el, key, _old, value) => { el.props[key] = value; },
  parentNode: el => el.parent,
  nextSibling: el => el.parent?.children[el.parent.children.indexOf(el) + 1],
  insert(el, parent, anchor) {
    if (el.parent) el.parent.children.splice(el.parent.children.indexOf(el), 1);
    const index = anchor ? parent.children.indexOf(anchor) : -1;
    parent.children.splice(index < 0 ? parent.children.length : index, 0, el); el.parent = parent;
  },
  remove(el) { el.parent.children.splice(el.parent.children.indexOf(el), 1); el.parent = null; },
});
const archive = '/daily/math/';
const leaf = (text, link) => ({ text, link });
const folder = (text, items, extra = {}) => ({ text, collapsed: true, items, ...extra });
const fixture = () => [
  folder('Archive', ['2026', '2025'].map(year => folder(year, ['10', '09'].map(month =>
    folder(`${year}-${month}`, [leaf(`${year}-${month} article`, `${archive}${year}-${month}-01`)])))), { link: archive }),
  folder('Math A', [folder('A1', [leaf('one', '/one')]), folder('A2', [leaf('two', '/two')])]),
  folder('Math B', [leaf('three', '/three')]),
];
function mount(props) {
  const root = node('root');
  const app = renderer.createApp(Group, { activePath: '/knowledge/math/', ...props }); app.mount(root);
  const all = (el = root) => [el, ...el.children.flatMap(child => all(child))];
  const textContent = el => (typeof el.text === 'string' ? el.text : '') + el.children.map(textContent).join('');
  const section = text => all().find(el => el.type === 'section' && all(el.children[0]).some(n => n.props.class === 'text' && textContent(n) === text));
  const expanded = text => !section(text).props.class.split(' ').includes('collapsed');
  const toggle = async (text, keyboard = false) => {
    const row = section(text).children[0];
    if (keyboard) row.props.onKeydown({ key: ' ', preventDefault() {} });
    else if (row.props.role === 'button') row.props.onClick();
    else row.children.find(el => el.type === 'button').props.onClick({ stopPropagation() {} });
    await nextTick();
  };
  return { app, all, section, expanded, toggle };
}

test('direct historical article opens exact branch and retains native links', async () => {
  const ui = mount({ items: fixture(), activePath: `${archive}2025-09-01` });
  for (const text of ['Archive', '2025', '2025-09']) assert.ok(ui.expanded(text));
  assert.equal(ui.expanded('2026'), false);
  assert.match(ui.section('2025-09 article').props.class, /is-active/u);
  assert.ok(ui.all().some(el => el.type === 'a' && el.props.href === `${archive}2025-09-01`));
  ui.app.unmount();
});

test('Daily has whole-tree sibling exclusion and keyboard toggles', async () => {
  const ui = mount({ items: fixture() });
  await ui.toggle('Math A'); await ui.toggle('Math B');
  assert.equal(ui.expanded('Math A'), false); assert.ok(ui.expanded('Math B'));
  await ui.toggle('Archive'); await ui.toggle('2026'); await ui.toggle('2025', true);
  assert.equal(ui.expanded('Math B'), false); assert.equal(ui.expanded('2026'), false);
  assert.ok(ui.expanded('2025'));
  ui.app.unmount();
});

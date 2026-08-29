# CLAUDE.md

Guidance for Claude Code when working in this repo.

## Project

React Native (0.79) app with AWS Amplify Gen 2 backend (`amplify/`). Screens live under `src/screens`, shared/family-flow components under `src/components`, navigation under `src/navigation`, Zustand stores under `src/store`, API calls under `src/api`.

## Commands

- `npm test` — run Jest tests (`__tests__/`)
- `npm run lint` — ESLint (`@react-native/eslint-config`)
- `npx tsc --noEmit` — type-check
- `npx prettier --write <files>` — format

## Formatting: multi-line JSX closing bracket

`.prettierrc.js` sets `bracketSameLine: false`. When a JSX opening tag wraps its
attributes across multiple lines, the closing `>` must sit on its own line,
indented to match the opening `<Tag`:

```tsx
// Correct
<Pressable
  key={size}
  style={[styles.chip, newRoomSize === size && styles.chipSelected]}
  onPress={() => setNewRoomSize(size)}
>
  <Text>...</Text>
</Pressable>

// Wrong — do not append `>` to the last attribute line
<Pressable
  key={size}
  style={[styles.chip, newRoomSize === size && styles.chipSelected]}
  onPress={() => setNewRoomSize(size)}>
  <Text>...</Text>
</Pressable>
```

This is enforced by Prettier config, not just convention — run
`npx prettier --write "src/**/*.{ts,tsx}" "__tests__/**/*.{ts,tsx}" App.tsx "amplify/**/*.ts"`
after any JSX edit if you're not sure the formatting is correct, rather than
hand-aligning brackets.

Other `.prettierrc.js` settings worth knowing: `bracketSpacing: true` (spaces
inside `{}` for destructuring/object literals, e.g. `const { foo } = x` and
`{ text: '취소', style: 'cancel' }` — this does *not* apply to JSX expression
containers like `style={styles.x}`; those are padded manually, see below),
`trailingComma: 'all'`, `arrowParens: 'avoid'`.

## Quote style: double quotes under components/screens/__tests__

`.prettierrc.js`'s top-level `singleQuote` is `true` (single quotes — the
project default everywhere: `store/`, `api/`, `navigation/`, `widget/`,
`amplify/`, etc.), but an `overrides` entry flips it to `singleQuote: false`
(double quotes) specifically for `src/components/**`, `src/screens/**`, and
`__tests__/**`. `.eslintrc.js` has a matching scoped `overrides` entry so the
`quotes` rule agrees with Prettier per directory instead of flagging one side.
When adding a new file under those three directories, use double quotes to
match; everywhere else, single quotes. `npx prettier --write` picks the right
quote style per file automatically since it's driven by the override globs.

## Formatting: call-expression parens under components/screens/__tests__ (NOT enforced by Prettier — manual only)

Also scoped to `src/components/**`, `src/screens/**`, `__tests__/**`: every
function/method **call** with non-empty arguments gets a padding space right
after `(` and right before `)`, when the call is written on a single line:

```tsx
// Correct
const family = useFamilyStore( state => state.family );
const [isSaving, setIsSaving] = React.useState( false );
getRoomColor( block.key );
navigation.navigate( "RoomDetail", { roomId: room.id } );

// Wrong
const family = useFamilyStore(state => state.family);
```

Rules for what counts as a "call" here (this is hand-applied — there is no
Prettier or ESLint option for it, so get the distinction right by hand):

- Only actual invocations: `identifier(`, `obj.method(`, `array[i](`,
  `generic<T>(`. Not padded: empty calls `fn()`, function/arrow **parameter**
  lists (`function Foo(props) {`, `(a, b) => {`), grouping parens
  (`(a || b)`), and control-flow keywords that happen to precede `(` —
  `if (`, `while (`, `for (`, `switch (`, `catch (` are never calls, never pad
  them.
- Multi-line calls where the opening `(` is immediately followed by a newline
  are left alone (nothing to pad against) — e.g.
  `useChoreStore(\n  state => state.fetchChoresForFamily,\n)`. But if the
  first/last line of a multi-line call has other content directly touching
  the paren (e.g. `StyleSheet.create({` / `});`), pad those:
  `StyleSheet.create( {` ... `} );`.
- Idempotent: `fn( x )` is already correct, don't double-pad.

**This is not expressible via Prettier or ESLint config**, so
`npx prettier --write` on a file in these three directories will strip this
padding back out (along with the ternary formatting above) every time it
runs. After formatting a file in this scope, re-apply both the ternary shape
and this paren padding by hand rather than trusting the formatter's output.

## Formatting: JSX attribute/child brace padding under components/screens/__tests__ (NOT enforced by Prettier — manual only)

Also scoped to `src/components/**`, `src/screens/**`, `__tests__/**`: every
JSX expression container (`{...}`) — attribute values and children — gets a
padding space right after `{` and right before `}`, when it's written on a
single line. When a JSX tag's entire content is one simple leaf (plain text
and/or one inline `{expr}`, all on the same line as the tags), also add a
space between the opening tag's `>` and the content, and between the content
and the closing tag's `<`:

```tsx
// Correct
<View style={ styles.content }> { children } </View>
<Text style={ styles.error }> { roomError } </Text>
<Text style={ styles.addRoomLinkText }> + 방 추가 </Text>
{ ROOM_TYPES.map( roomType => ( ... ) ) }

// Wrong
<View style={styles.content}>{children}</View>
```

Same exemptions as the paren rule above: only pad when the char right inside
`{`/`}` is non-whitespace on that line — multi-line expression containers
(e.g. a ternary already broken onto its own lines per the rule below, or an
attribute value that Prettier already wrapped like `style={\n  cond\n    ? a\n    : b\n}`)
are left alone since there's nothing adjacent to pad against. The `>`/`<`
boundary padding only applies when the tag's content is a single leaf sitting
on the same line as both tags — content that Prettier already split across
multiple lines (tag, then indented content, then closing tag) keeps its
normal indentation and is not retrofitted with boundary spaces.

**This is not expressible via Prettier config** (JSX expression containers
are deliberately never spaced by Prettier, `bracketSpacing` or not), so
`npx prettier --write` on a file in these three directories will strip this
padding too, on top of resetting the ternary shape and call-paren padding
above. Re-apply all three by hand after formatting — don't skip this one
just because it's easy to miss on a quick pass.

## Formatting: long ternaries in JSX (NOT enforced by Prettier — manual only)

When a JSX conditional-render ternary (`{cond ? <A/> : <B/>}`) would be 50+
characters written inline, it must be hand-formatted as:

```tsx
{
  condition
  ? <TrueBranch />
  : <FalseBranch />
}
```

not Prettier's default:

```tsx
{condition ? (
  <TrueBranch />
) : (
  <FalseBranch />
)}
```

Key details, taken from how this was actually applied across the codebase:

- `{` and `}` sit alone on their own lines, indented to match where the
  ternary starts (same level as its surrounding JSX).
- `condition`, `?`, and `:` all sit at one indent level deeper than `{`/`}`,
  with `?`/`:` at the *same* indent as `condition` (not indented further).
- Each branch keeps its own normal internal JSX indentation exactly as
  Prettier would already produce it for that branch alone — only prepend
  `? ` / `: ` to the branch's first line. Don't reflow the branch's inner
  content to align with the `?`/`:` prefix.
- A `null` branch is just `: null` (no wrapping).
- Ternaries that select a plain string/prop value (not JSX), e.g.
  `{isSaving ? '저장 중' : '저장'}` or `onPress={isOwner ? fn : undefined}`,
  are not "conditional rendering" in this sense and are left in normal
  Prettier style — this convention is specifically for branches that render
  JSX elements.

**This is not expressible via any Prettier option** (JSX expression
containers and ternary-breaking are not configurable that way), so
`npx prettier --write` on a file containing this pattern will collapse it
straight back to the default `? (` / `) : (` shape. That conflicts with the
"run prettier after any JSX edit" advice above — when a file has one of these
ternaries, re-apply this manual shape to it after formatting instead of
trusting the formatter's output for that block.

## Colors

`src/styles/commonStyle.ts` exports two palettes:

- `colors` — general palette (room tile colors, neutrals like `white`/`black`/`gray`).
- `commonColor` — semantic UI colors used across screens: `backgroundColor`
  (screen root view background), `touchable` (primary action color),
  `negative` (destructive/error color), `overlay` (modal backdrop).

Prefer `commonColor.*` for anything tied to UI role (screen background,
buttons, errors) rather than reaching into `colors` directly.

## Known pre-existing issue

`src/components/RoomSetupScreen/RoomBlockTile.tsx` /
`src/components/RoomSetupScreen/RoomSetupScreen.tsx` have an incomplete room-size
stepper feature (dead `sizeIndex`/`ROOM_SIZES`/`ROOM_SIZE_LABELS` references,
missing stepper UI). This causes 4 failing tests in
`RoomSetupScreen.test.tsx` and a few `no-unused-vars` lint errors that are
unrelated to unrelated changes — don't try to silently "fix" them as a side
effect of other work; call it out instead.

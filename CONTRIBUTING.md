# Contributing to Sound First Mobile

## Development Standards

These rules are non-negotiable for all contributions.

### Code Quality

1. **Search before creating** — Check the codebase for existing implementations before writing new code
2. **TypeScript strict mode** — No `any` types, full type coverage
3. **Tests alongside code** — Write tests with implementation, not after
4. **Meaningful names** — Self-documenting code with clear variable/function names
5. **Follow existing patterns** — Match conventions in the codebase

### State Management

| Pattern      | When to Use                                    |
| ------------ | ---------------------------------------------- |
| `useState`   | 1-3 simple, independent values                 |
| `useReducer` | 5+ related state values or complex transitions |
| `Context`    | Shared state across component tree             |

For `useReducer`, co-locate files:

- `{feature}Types.ts` — State and action types
- `{feature}Reducer.ts` — Pure reducer function
- `{Feature}.tsx` — Component using reducer

### Component Guidelines

```tsx
// ✅ Good: Named exports, typed props
export interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}

export function Button({ label, onPress, disabled = false }: ButtonProps) {
  return (
    <TouchableOpacity
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
    >
      <Text>{label}</Text>
    </TouchableOpacity>
  );
}
```

### Accessibility Requirements

All interactive components must have:

- `accessibilityLabel` — Describes the element
- `accessibilityRole` — Element type (button, checkbox, etc.)

### Testing

```bash
# Run all tests
npm test

# Run specific test
npm test -- --testPathPattern="ComponentName"

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

**Test requirements:**

- Test all code paths
- Name tests clearly: `it('shows error when email is invalid')`
- Test edge cases and error states
- Mirror source structure in `__tests__/`

### File Organization

| Type             | Location                        |
| ---------------- | ------------------------------- |
| Shared component | `src/components/`               |
| Feature module   | `src/features/{feature}/`       |
| Screen           | `src/screens/{Feature}/`        |
| Shared hook      | `src/hooks/`                    |
| Feature hook     | `src/features/{feature}/hooks/` |

Barrel exports in every directory:

```typescript
// src/components/buttons/index.ts
export { PrimaryButton } from "./PrimaryButton";
export type { PrimaryButtonProps } from "./PrimaryButton";
```

### Shared Exercise Hooks

When creating exercises, use shared hooks from `src/screens/Session/components/exercises/shared/`:

| Hook                     | Use For                          |
| ------------------------ | -------------------------------- |
| `useQuizExerciseState`   | Multiple-choice quiz exercises   |
| `useTimingExerciseState` | Metronome/timing-based exercises |
| `useLessonExerciseState` | Phase-based lesson exercises     |

### Commits

Make atomic commits — one concern per commit:

```
✅ "Add validation to email field"
❌ "Update form and fix styles and add tests"
```

### Documentation

- Add JSDoc to public functions and hooks
- Include `@example` for non-obvious usage
- Document props with comments when TypeScript types alone aren't sufficient

## Quick Reference

```bash
# Install
npm install

# Start Metro (dev client required)
npx expo start --dev-client

# Run tests
npm test

# Lint
npm run lint
```

## Further Reading

- [ARCHITECTURE.md](ARCHITECTURE.md) — Codebase patterns and conventions
- [TESTING_GUIDE.md](TESTING_GUIDE.md) — Dev client setup and build instructions

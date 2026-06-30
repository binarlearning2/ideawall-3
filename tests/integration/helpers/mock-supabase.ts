import { vi } from "vitest";

/**
 * Minimal chainable mock that mimics the subset of the Supabase JS query builder API
 * used by our route handlers (select/eq/in/order/insert/update/delete + single/maybeSingle,
 * plus being awaitable directly for calls that don't terminate with .single()).
 *
 * Each call to `.from(table)` on the mock client pops the next canned response off a
 * queue, in the same order the route handler under test calls `.from(...)`. This keeps
 * the mock simple at the cost of being order-sensitive — acceptable for integration tests
 * at this scope (see webapp-tester skill, references/api-testing.md).
 */
export interface MockResult<T = unknown> {
  data: T | null;
  error: { message: string; code?: string } | null;
  count?: number | null;
}

class MockQueryBuilder<T = unknown> implements PromiseLike<MockResult<T>> {
  constructor(private result: MockResult<T>) {}

  select() {
    return this;
  }
  eq() {
    return this;
  }
  in() {
    return this;
  }
  order() {
    return this;
  }
  insert() {
    return this;
  }
  update() {
    return this;
  }
  delete() {
    return this;
  }
  maybeSingle() {
    return Promise.resolve(this.result);
  }
  single() {
    return Promise.resolve(this.result);
  }
  then<TResult1 = MockResult<T>, TResult2 = never>(
    onfulfilled?: ((value: MockResult<T>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.result).then(onfulfilled, onrejected);
  }
}

export function buildMockClient(opts: {
  user?: { id: string; email?: string } | null;
  fromResponses: MockResult[];
}) {
  const queue = [...opts.fromResponses];

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: opts.user ?? null } }),
    },
    from: vi.fn(() => {
      const next = queue.shift();
      if (!next) {
        throw new Error(
          "MockSupabaseClient: ran out of canned responses — check the call order/count."
        );
      }
      return new MockQueryBuilder(next);
    }),
  };
}

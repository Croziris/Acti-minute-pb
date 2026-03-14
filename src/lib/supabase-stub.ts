type SupabaseResponse<T = unknown> = {
  data: T;
  error: null;
  count: number | null;
};

const defaultResponse: SupabaseResponse<null> = {
  data: null,
  error: null,
  count: null,
};

const createChain = (response: SupabaseResponse = defaultResponse): any => {
  const callable = () => chain;
  const promise = Promise.resolve(response);

  const chain = new Proxy(callable as any, {
    get: (_target, prop: string | symbol) => {
      if (prop === 'then') {
        return promise.then.bind(promise);
      }

      if (prop === 'catch') {
        return promise.catch.bind(promise);
      }

      if (prop === 'finally') {
        return promise.finally.bind(promise);
      }

      if (prop === 'unsubscribe') {
        return () => undefined;
      }

      if (prop === 'data') {
        return response.data;
      }

      if (prop === 'error') {
        return response.error;
      }

      if (prop === 'count') {
        return response.count;
      }

      return chain;
    },
    apply: () => chain,
  });

  return chain;
};

const supabaseStub: any = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({
      data: {
        subscription: {
          unsubscribe: () => undefined,
        },
      },
    }),
    signInWithPassword: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
  functions: {
    invoke: async () => ({ data: null, error: null }),
  },
  storage: {
    from: () => ({
      upload: async () => ({ data: { path: '' }, error: null }),
      createSignedUrl: async () => ({ data: { signedUrl: '' }, error: null }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
      remove: async () => ({ data: null, error: null }),
    }),
  },
  channel: () => ({
    on: () => ({
      subscribe: () => ({
        unsubscribe: () => undefined,
      }),
    }),
    subscribe: () => ({
      unsubscribe: () => undefined,
    }),
  }),
  removeChannel: () => undefined,
  from: () => createChain(),
};

export const supabase = supabaseStub;

export default supabase;

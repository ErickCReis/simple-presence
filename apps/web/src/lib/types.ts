export type AsyncIteratorData<I> = I extends AsyncIterator<infer T> ? T : never;

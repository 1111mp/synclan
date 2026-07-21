import { has } from 'lodash-es';

// We want this to work with any object, so we allow `object` here.
export function getOwn<TObject extends object, TKey extends keyof TObject>(
  obj: TObject,
  key: TKey,
): TObject[TKey] | undefined {
  return has(obj, key) ? obj[key] : undefined;
}

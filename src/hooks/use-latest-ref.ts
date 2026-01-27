/// refrence from https://github.com/streamich/react-use/pull/2509

import { useEffect, useRef } from 'react';

const useLatestRef = <T>(value: T): { readonly current: T } => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
};

export { useLatestRef };

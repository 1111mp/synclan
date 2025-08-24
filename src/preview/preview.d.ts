declare global {
  interface Window {
    __SYNCLAN__PREVIEW__INIT_DATA__?: {
      current: number;
      list: Array<PreviewCore>;
    };
  }

  interface PreviewCore {
    type: 'image' | 'video';
    url: string;
    width?: number;
    height?: number;
  }
}

export {};

// O jsdom não implementa matchMedia, que o tema e o MUI consultam.
// Por padrão: tema claro e movimento normal.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}

// O editor de texto (ProseMirror) mede posições ao rolar e ao selecionar, e o
// jsdom não faz layout. Estes stubs devolvem "sem retângulos" só para ele não quebrar.
if (typeof document !== "undefined") {
  const emptyRect = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    toJSON: () => ({}),
  } as DOMRect;
  const emptyRects = () =>
    Object.assign([], { item: () => null }) as unknown as DOMRectList;

  Range.prototype.getClientRects ??= emptyRects;
  Range.prototype.getBoundingClientRect ??= () => emptyRect;
  Element.prototype.getClientRects ??= emptyRects;
  document.elementFromPoint ??= () => null;
}

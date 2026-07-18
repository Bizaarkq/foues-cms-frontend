/**
 * childPath — joins a page path and one child segment.
 *
 * A naive `${parentPath}/${segment}` produces "//segment" when the parent is
 * the root page ("/"), which browsers treat as a protocol-relative URL (the
 * segment becomes a hostname). Blocks placed on the home page hit this when
 * deriving virtual child URLs (magazine editions, /pagina/{n}).
 */
export function childPath(parentPath: string, segment: string): string {
  return parentPath === "/" ? `/${segment}` : `${parentPath}/${segment}`;
}

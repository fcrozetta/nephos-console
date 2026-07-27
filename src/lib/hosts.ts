/**
 * Preview the hostnames an install will generate.
 *
 * Nephos derives hostnames from the instance slug and the configured root
 * domains; a manifest declares route/portal *intent*, never a host. So the
 * install form cannot offer a URL field to edit -- the only levers are the
 * instance name and the Platform page's root domains. Showing the derived host
 * up front is what makes that legible instead of surprising.
 *
 * These rules mirror the API (ADR 20260726 / 20260518). They are duplicated here
 * deliberately: the alternative is a round-trip per keystroke to preview a string
 * the server computes from data the client already has. If the API ever returns a
 * preview, delete this.
 */

export type RootDomain = {
  name: string;
  domain: string;
  default?: boolean;
  allowsServicePortals?: boolean;
};

/** App routes bind to every configured root domain; canonical is the default. */
export function appCanonicalDomain(domains: RootDomain[]): RootDomain | undefined {
  return domains.find((d) => d.default) ?? domains[0];
}

/**
 * Service portals bind only to root domains opted in to carrying them, and
 * canonical falls back to the first eligible when the default is not eligible --
 * the normal setup, where the default domain is public and only the local one
 * carries admin surfaces.
 */
export function portalCanonicalDomain(domains: RootDomain[]): RootDomain | undefined {
  const eligible = domains.filter((d) => d.allowsServicePortals);
  if (eligible.length === 0) return undefined;
  return eligible.find((d) => d.default) ?? eligible[0];
}

/** First route/portal is bare `<slug>`; later ones are `<name>.<slug>`. */
export function hostPrefix(slug: string, name: string, isFirst: boolean): string {
  return isFirst ? slug : `${name}.${slug}`;
}

export function previewUrls(
  slug: string,
  entries: { name: string }[],
  domain: RootDomain | undefined
): { name: string; url: string | null }[] {
  return entries.map((entry, index) => ({
    name: entry.name,
    // Phase 1 Nephos-managed ingress is HTTP-only (ADR 20260517).
    url: domain ? `http://${hostPrefix(slug, entry.name, index === 0)}.${domain.domain}` : null
  }));
}

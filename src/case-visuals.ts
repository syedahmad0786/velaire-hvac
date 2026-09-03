import type { ServiceCase } from "./domain";

const DISPATCH_ORIGIN = {
  label: "Velaire dispatch area (synthetic)",
  text: "West Town, Chicago, IL 60642",
  timeZone: "America/Chicago",
} as const;

const TRAVEL_BANDS: Record<string, readonly [number, number]> = {
  "60610": [15, 30],
  "60613": [20, 35],
  "60614": [15, 30],
  "60657": [20, 35],
};

const stageLabels: Record<ServiceCase["status"], string> = {
  awaiting_provider: "Request sent",
  negotiating: "Negotiating",
  offer_available: "Offer available",
  booking_prepared: "Awaiting customer confirmation",
  booked: "Booked",
  change_pending: "Change approval required",
};

function graphLabel(value: string): string {
  return value.replace(/["\n\r]/g, " ").replace(/[<>]/g, "").slice(0, 72);
}

function directionsUrl(base: string, origin: string, destination: string): string {
  const url = new URL(base);
  if (url.hostname === "www.google.com") {
    url.searchParams.set("api", "1");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    url.searchParams.set("travelmode", "driving");
  } else {
    url.searchParams.set("saddr", origin);
    url.searchParams.set("daddr", destination);
    url.searchParams.set("dirflg", "d");
  }
  return url.toString();
}

export function planServiceRoute(serviceCase: ServiceCase, departAt = new Date().toISOString()) {
  const destination = serviceCase.serviceLocation;
  if (!destination?.customerConfirmed) return undefined;
  const departure = new Date(departAt);
  if (Number.isNaN(departure.getTime())) throw new RangeError("departAt must be a valid ISO date-time.");
  const [lowerMinutes, upperMinutes] = TRAVEL_BANDS[serviceCase.postcode] ?? [30, 50];
  const earliestArrivalAt = new Date(departure.getTime() + lowerMinutes * 60_000).toISOString();
  const latestArrivalAt = new Date(departure.getTime() + upperMinutes * 60_000).toISOString();
  const format = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPATCH_ORIGIN.timeZone,
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
  const latestOffer = serviceCase.offers.at(-1);

  return {
    caseId: serviceCase.id,
    revision: serviceCase.revision,
    origin: { ...DISPATCH_ORIGIN, synthetic: true },
    destination: {
      text: destination.text,
      precision: destination.precision,
      customerConfirmed: true,
    },
    travelMode: "driving" as const,
    requestedOrOfferedWindow: latestOffer?.arrivalWindow ?? serviceCase.preferredWindows[0] ?? null,
    windowAuthority: latestOffer ? "owner_offered" as const : serviceCase.preferredWindows[0] ? "customer_requested" as const : "none" as const,
    planningEstimate: {
      departAt: departure.toISOString(),
      lowerMinutes,
      upperMinutes,
      earliestArrivalAt,
      latestArrivalAt,
      display: `${format.format(new Date(earliestArrivalAt))}–${format.format(new Date(latestArrivalAt))}`,
      liveTraffic: false,
      basis: `Synthetic postcode planning band for ${serviceCase.postcode}; no live traffic, distance matrix, or technician GPS was used.`,
    },
    directions: {
      googleMapsUrl: directionsUrl("https://www.google.com/maps/dir/", DISPATCH_ORIGIN.text, destination.text),
      appleMapsUrl: directionsUrl("https://maps.apple.com/", DISPATCH_ORIGIN.text, destination.text),
    },
    limitation: "These links ask the selected map provider to calculate a driving route. Velaire has not geocoded the address, checked live traffic, tracked a technician, or promised an arrival time.",
  };
}

export function caseVisuals(serviceCase: ServiceCase, origin: string, accessToken?: string) {
  const location = serviceCase.serviceLocation?.text ?? `${serviceCase.postcode}, Chicago, IL`;
  const visualUrl = new URL(`/case-graph/${encodeURIComponent(serviceCase.id)}`, origin);
  visualUrl.searchParams.set("case", serviceCase.id);
  if (accessToken) visualUrl.searchParams.set("access", accessToken);

  const nodes = serviceCase.messages.map((message, index) => ({
    id: `event-${index + 1}`,
    actor: message.actor,
    label: message.text,
    revision: message.revision,
    occurredAt: message.createdAt,
  }));
  const edges = nodes.slice(1).map((node, index) => ({ from: nodes[index].id, to: node.id }));
  const mermaidNodes = nodes
    .map((node, index) => `  E${index + 1}["${graphLabel(`${node.actor}: ${node.label}`)}"]`)
    .join("\n");
  const mermaidEdges = nodes.slice(1).map((_, index) => `  E${index + 1} --> E${index + 2}`).join("\n");

  return {
    caseId: serviceCase.id,
    revision: serviceCase.revision,
    status: serviceCase.status,
    stageLabel: stageLabels[serviceCase.status],
    nodes,
    edges,
    mermaid: `flowchart LR\n${mermaidNodes}${mermaidEdges ? `\n${mermaidEdges}` : ""}`,
    visualUrl: visualUrl.toString(),
    location: {
      text: location,
      precision: serviceCase.serviceLocation?.precision ?? "postcode",
      customerConfirmed: serviceCase.serviceLocation?.customerConfirmed ?? false,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`,
      openStreetMapUrl: `https://www.openstreetmap.org/search?query=${encodeURIComponent(location)}`,
      limitation: "This opens a map search for customer-supplied text; Velaire does not geocode, verify, or expose coordinates.",
    },
    route: planServiceRoute(serviceCase),
    totals: {
      latestOfferCents: serviceCase.offers.at(-1)?.totalCents ?? null,
      acceptedCents: serviceCase.receipt?.acceptedOffer.totalCents ?? null,
      pendingChangeCents: serviceCase.changeOrders.find((item) => item.status === "pending")?.deltaCents ?? null,
    },
  };
}

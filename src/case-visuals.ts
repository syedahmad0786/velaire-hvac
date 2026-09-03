import type { ServiceCase } from "./domain";

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
    totals: {
      latestOfferCents: serviceCase.offers.at(-1)?.totalCents ?? null,
      acceptedCents: serviceCase.receipt?.acceptedOffer.totalCents ?? null,
      pendingChangeCents: serviceCase.changeOrders.find((item) => item.status === "pending")?.deltaCents ?? null,
    },
  };
}

# PromiseDiff submission kit

## Devpost one-liner

PromiseDiff turns the missing middle between service search and payment into a versioned WebMCP agreement room where agents prepare and compare—but humans commit.

## Short description

Local-service bookings often begin in chat and end with a different invoice. PromiseDiff gives the customer and provider one authoritative, versioned ServiceCase. ChatGPT can match an HVAC need, inspect provenance-bearing evidence, open a request, wait for a real owner reply, negotiate a bounded counteroffer, prepare exact booking terms, and compare later changed work. The provider agent can stage replies, offers, and change orders, but only the visible human controls can send or approve them. An immutable receipt preserves the accepted promise before later terms move.

PromiseDiff is implemented directly in the web application with native imperative WebMCP. Customer and owner tools are route-scoped, every write is revision-checked, emergency HVAC language fails closed, async waits honor browser cancellation, and all synthetic evidence declares its trust status.

## 2:40 demo script

**0:00–0:18 — Problem**

“Search can find a contractor and booking can reserve a slot, but the promise often lives in disappearing chat. PromiseDiff makes every offer, approval, and later change machine-readable and human-visible.”

**0:18–0:36 — Native discovery**

Open `/demo/customer?judge=1`. Show the WebMCP indicator and customer tool list in ChatGPT. Ask: “Check whether same-day help for an AC blowing warm air in 60614 fits a $180 ceiling, and show pricing and warranty evidence.”

**0:36–0:55 — Open case**

Ask ChatGPT to open the service case with no surprise travel fee and approval before added work. Point to the authoritative revision and visible audit trail.

**0:55–1:20 — Async owner and private draft**

Ask ChatGPT to wait for an owner reply. In the judge simulator, stage the `$195` offer. Emphasize that nothing appears for the customer. Press **Human: send offer**; the pending tool call receives the new revision.

**1:20–1:42 — Structured negotiation**

Ask ChatGPT to counter at `$175` with no after-hours surcharge. Stage and human-send the revised offer. Ask ChatGPT to compare V1 and V2; show the exact `$20` decrease and unchanged arrival window.

**1:42–2:02 — Human booking gate**

Ask ChatGPT to prepare V2. Point out that it stops at `AWAITING_HUMAN`. Click **I confirm these terms**. Open the receipt and show that it stores the complete offer snapshot, not merely an ID.

**2:02–2:30 — PromiseDiff moment**

Stage and human-send the `+$145` capacitor change order. Ask ChatGPT to compare it with the accepted promise. Show: parts were excluded, total rises from `$175` to `$320`, schedule adds 30 minutes, and customer approval is still required.

**2:30–2:40 — Close**

“Two agents can collaborate across one live case, but neither can silently commit the humans. That is PromiseDiff.”

## Judge test prompts

```text
Check whether same-day service for an AC blowing warm air in 60614 fits a $180 budget. Show the pricing, warranty, and review sources and clearly identify what is synthetic.
```

```text
Open an AC diagnostic case for today 2–4 PM with a $180 ceiling, no surprise travel fee, and approval required before additional work. Then wait up to 20 seconds for the owner.
```

```text
Counter the latest offer at $175 with the same window and no after-hours surcharge. When the owner replies, compare the old and new offer versions.
```

```text
Prepare the latest offer for booking, but do not approve it for me.
```

```text
Compare the pending change order with my accepted receipt. Tell me the new total, whether the added work was originally included or excluded, and what still requires my decision.
```

## Final manual checklist

- Record at 1080p with browser zoom at 100%.
- Keep the public video under three minutes.
- Show native WebMCP discovery, not only button clicks.
- Show one private draft before the human sends it.
- Show the `AWAITING_HUMAN` booking stop.
- Show the immutable receipt and `+$145` change comparison.
- Keep synthetic labels visible.
- Add public deployment, repository, implementation explanation, and YouTube URL to Devpost.

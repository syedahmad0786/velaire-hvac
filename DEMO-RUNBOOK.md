# Velaire — One-Take Demo Runbook

This is the canonical recording sheet. Use it from the unrecorded monitor. Everything in brackets is an operator cue and must not be spoken.

Target final length: **2:45–2:58**. Record continuously. If a model call takes longer than the narration beside it, stay silent and remove only that dead wait before upload.

## What the recording must prove

One fictional HVAC request moves through two separate ChatGPT conversations and one shared, versioned Velaire service case:

`customer request → owner offer → customer counter → revised offer → human booking → changed-work comparison`

The video must make five boundaries unmistakable:

1. The customer and owner are in separate chats with separate private page capabilities.
2. Their agents do not message one another directly; both act on the same durable service case.
3. An agent may read, wait, compare, and stage, but it cannot send an owner commitment or approve for a customer.
4. Page updates appear automatically, but ChatGPT waits only in bounded short rounds. It is not a permanent subscription or background notification service.
5. Every business, person, price, address area, review, booking, and record shown is synthetic.

## 1. Exact screen setup

### Recommended recorded monitor

Use **two separate ChatGPT chats**, named exactly:

- `CUSTOMER — Velaire demo`
- `OWNER — Velaire demo`

Open each chat in its own ChatGPT desktop window. The same ChatGPT account is sufficient; the authority comes from the page open in each chat, not from separate accounts.

In each active window:

- Collapse the ChatGPT history sidebar.
- Keep the chat at roughly **32%** of the width.
- Keep ChatGPT's built-in browser and the Velaire page at roughly **68%** of the width.
- Use 100% website zoom and a chat text size that remains readable at 1080p.
- Switch between the two full-size role windows with `Alt+Tab`.

This is clearer than permanently stacking two tiny chats. More importantly, each ChatGPT conversation visibly retains its own live Velaire page. A normal Chrome tab may be used as a spectator, but it is not what gives either chat its WebMCP tools.

```text
ACTIVE CUSTOMER WINDOW                 ACTIVE OWNER WINDOW
┌──────────────┬───────────────────┐   ┌──────────────┬───────────────────┐
│ Customer     │ Customer Velaire │   │ Owner        │ Private owner     │
│ ChatGPT 32%  │ page 68%         │   │ ChatGPT 32%  │ page 68%          │
└──────────────┴───────────────────┘   └──────────────┴───────────────────┘
                 Alt+Tab between the two
```

### Unrecorded monitor

- Open this file at 125–140% zoom.
- Keep the current step and paste prompt visible.
- Keep the recorder controls and a timer here.
- Do not place a third ChatGPT agent in this workflow.

### Privacy and capture rules

- Capture at 1920×1080 or higher with clear audio.
- Turn on Do Not Disturb and close email, Slack, WhatsApp, password managers, and personal tabs.
- Never show a URL containing `access=`. It is a bearer capability.
- Never paste the private owner invite into a chat message. Paste it directly into the owner chat's built-in browser before recording.
- Use only `Lincoln Park, Chicago, IL 60614` as the synthetic customer area. Do not enter a real home address.
- Keep the `Fictional demo` label visible whenever possible.

### Screenshot gate

Before recording, attach one screenshot of the proposed recorded monitor. It passes only if:

- the active chat title clearly says `CUSTOMER` or `OWNER`;
- both the chat text and the Velaire page are readable without zooming the video;
- the Velaire page occupies about two-thirds of the active window;
- no private query token, account email, notification, bookmark, or personal data is visible;
- the synthetic-demo label and current case state are visible;
- the chat is using a WebMCP-capable model and its Velaire page remains open.

## 2. Pre-record setup — do not narrate

Use GPT-5.6 Sol or Terra if available. Current OpenAI guidance says WebMCP is available in ChatGPT's built-in browser with supported models, and page tools can disappear if the page is closed or navigated away from.

### A. Create the customer case

In `CUSTOMER — Velaire demo`, open this URL in ChatGPT's built-in browser:

https://velaire-hvac.vercel.app/demo/customer

Paste setup prompt C0:

```text
My AC is blowing warm air in 60614. Can Velaire help today for no more than $180? Show me its pricing, availability, and warranty evidence. This is a synthetic demo. Do not book anything.
```

After the answer, paste setup prompt C1:

```text
Open a synthetic service request for today from 2 to 4 PM. Use Lincoln Park, Chicago, Illinois 60614 as my confirmed synthetic service area. Add two conditions: no surprise travel fee, and ask me before any additional work. Stop after creating the request. Do not print any private capability URL in the chat.
```

Expected pre-record state:

- a new `SC-…` case exists;
- the customer page says `Awaiting Provider`;
- the case is revision 1;
- no owner offer has been staged or sent;
- the private owner invite is visible as a copy control on the page.

### B. Connect the owner chat

1. Copy the private owner invite from the customer page.
2. In `OWNER — Velaire demo`, paste that URL directly into ChatGPT's built-in browser address field.
3. Do not paste it into the conversation.
4. Confirm the owner page shows the same case code and `Awaiting Provider`.
5. Leave both role pages open. Do not navigate either chat away from Velaire.

### C. Optional spectator page

If you insist on a separate Chrome page, open the customer capability URL before recording and crop the entire address bar in OBS. Chrome is only a visual mirror; the actual tool calls still come from the role page open inside each ChatGPT chat. The recommended take does not need this extra window.

## 3. One-take operator timeline and exact narration

The paste prompts deliberately contain no WebMCP tool names. Natural intent must select the correct page capability.

### 00:00 — Establish the product and the two roles

**[ACTION — DO NOT READ: Show the CUSTOMER window. The chat history may show setup prompts C0 and C1. The Velaire customer page should show revision 1 and Awaiting Provider. Start recording.]**

**SAY:**

> Finding an HVAC company is easy. Proving what was requested, accepted, and later changed is harder. Velaire is a fictional service website shared by a customer and owner in separate ChatGPT conversations. Their agents do not talk directly; each acts on the same versioned case, and neither can make the human's commitment.

### 00:18 — Let the customer wait for the owner

**[ACTION: Paste C2 into the CUSTOMER chat.]**

```text
Wait briefly for the owner’s first response to this case. Summarize it when it arrives. Do not approve or book anything, and do not print private links.
```

**SAY WHILE IT STARTS:**

> I am asking normally, so ChatGPT selects the page action. Waiting is cancellable and bounded to two minutes. If nobody replies, it reports that honestly; it cannot subscribe forever or wake itself later.

**[ACTION: As soon as the customer call is waiting, switch to the OWNER window.]**

### 00:33 — Owner agent stages the first offer

**[ACTION: Paste O1 into the OWNER chat.]**

```text
Read the customer’s request. Prepare a $195 offer for today from 2 to 4 PM with a $49 deposit. Include the cooling diagnostic, labour, and written findings. Exclude parts and refrigerant, and include a 30-day workmanship warranty. Stop before sending it.
```

**SAY:**

> This separate owner agent can prepare exact terms, but the draft stays private. Staging returns awaiting human and does not advance the public agreement.

**[ACTION: When the private draft appears on the owner page, pause for one second. Click `Human: send offer`.]**

**SAY AS YOU CLICK:**

> I am acting as the owner. Only this visible Send publishes the offer and advances revision one to revision two.

**[ACTION: Immediately paste O2 into the OWNER chat.]**

```text
Now wait briefly for the customer’s next reply and summarize only what changes. Do not prepare or send anything yet.
```

**[ACTION: Switch to the CUSTOMER window.]**

### 00:58 — Customer receives the offer, sees the route, and counters

**[ACTION: The earlier customer wait should now show the $195 offer. If it is still running, wait two seconds. Then paste C3.]**

```text
Show me the case history and the driving plan to my confirmed synthetic area. Clearly separate any planning estimate from live traffic. Then counter at $175, keep the same 2-to-4 PM window, and require no after-hours surcharge. Do not accept an offer.
```

**SAY:**

> The customer receives the new revision in its own chat, plus a visual history and map links. The fifteen-to-thirty-minute travel band is synthetic—there is no live traffic, GPS, or promised arrival. The customer sends a structured counter without accepting anything.

**[ACTION: Briefly show the case timeline and route card on the customer page. Then switch to the OWNER window.]**

### 01:25 — Owner receives the counter and prepares revision two

**[ACTION: The owner wait should now summarize the customer's $175 counter. Paste O3.]**

```text
Prepare a revised $175 offer with the same 2-to-4 PM window and $49 deposit. Keep parts and refrigerant excluded, and add that there is no after-hours surcharge. Stop before sending it.
```

**SAY:**

> The owner receives the counter from the durable case. This is shared state, not one bot playing both people. The revision remains private until the owner sends it.

**[ACTION: When the $175 private draft appears, click `Human: send offer`. Switch to the CUSTOMER window.]**

**SAY AS YOU SWITCH:**

> The second human Send creates offer version two at revision four.

### 01:48 — Deterministic comparison and customer booking gate

**[ACTION: Paste C4 into the CUSTOMER chat.]**

```text
Compare the original and revised offers. Prepare the latest offer for booking, but stop before approval.
```

**SAY:**

> Velaire compares stored terms, not screenshots: twenty dollars less, with the time and deposit unchanged. The agent prepares that exact version, but cannot confirm or charge.

**[ACTION: Show `AWAITING HUMAN` in chat or the prepared state on the page. On the customer page, click `I confirm these terms`.]**

**SAY AS YOU CLICK:**

> I am the customer confirming the displayed version. This creates an immutable synthetic receipt—without payment or a real appointment.

**[ACTION: Paste C5.]**

```text
Show me the complete accepted receipt. Do not change the case.
```

**[ACTION: Let the receipt summary appear, then switch to the OWNER window.]**

### 02:13 — Changed work is proposed after booking

**[ACTION: Paste O4 into the OWNER chat.]**

```text
Read the confirmed booking. Prepare a $145 changed-work request for a capacitor part replacement because a weak capacitor was found. State that it adds about 30 minutes. Stop before sending it.
```

**SAY:**

> Additional work is now proposed as a separate one-hundred-forty-five-dollar change, not a silent rewrite. Its capacitor part scope can be traced to the original exclusion for parts.

**[ACTION: When the private changed-work draft appears, click `Human: send change order`. Switch to the CUSTOMER window.]**

### 02:32 — Compare the later charge with the accepted promise

**[ACTION: Paste C6 into the CUSTOMER chat.]**

```text
Compare the changed-work request with what I accepted. Tell me the proposed total, whether this part was included before, and what still requires my decision. Then show the current visual history. Do not accept or reject the change.
```

**SAY:**

> Against the receipt, the total moves from one hundred seventy-five to three hundred twenty dollars. Parts were excluded, thirty minutes are added, and the customer still decides.

**[ACTION: Open `Open case graph`. Hold on the graph for two seconds. Click `Google driving route` and hold on the map for two seconds. Do not expose the private address bar.]**

**SAY:**

> The case becomes a revision graph and a real map-provider link, while the travel band remains clearly synthetic.

### 02:52 — Close

**[ACTION: Return to the customer case with the pending changed-work card visible. Do not accept or reject it.]**

**SAY:**

> This is WebMCP with a real business boundary: agents check and prepare; humans commit. Every important promise has a version and a receipt.

**[ACTION: Stop recording. Do not keep speaking.]**

## 4. Expected proof at each gate

| Gate | Expected visible result | What must remain impossible |
|---|---|---|
| New case | `Awaiting Provider`, revision 1 | No booking or charge |
| First owner draft | `$195`, `PRIVATE DRAFT`, `AWAITING_HUMAN` | Customer cannot see or accept it |
| First owner send | Offer V1, revision 2 | Agent did not press Send |
| Customer counter | `$175`, `AWAITING_OWNER`, revision 3 | No offer accepted |
| Revised owner draft | `$175`, private | No public revision yet |
| Revised owner send | Offer V2, revision 4 | Owner cannot accept for customer |
| Prepare booking | `AWAITING_HUMAN`, revision 5 | No booking or deposit |
| Customer confirm | `Booked`, revision 6, `RCPT-…` | No real appointment or payment |
| Change draft | `+$145`, private, revision still 6 | Accepted receipt unchanged |
| Change send | `Change Pending`, revision 7 | No customer decision made |
| Change comparison | `$175 + $145 = $320`, decision required | Agent cannot accept or reject |
| Route | West Town → Lincoln Park, 15–30 minute synthetic band, map links | No live traffic, GPS, geocoding, or arrival promise |

## 5. Recovery prompts — use only if needed

These prompts still use natural intent and do not name implementation tools.

### If a wait ends before the other person replies

```text
Check this same case again now. Summarize only what changed since the last revision.
```

### If the case changed and ChatGPT reports a stale revision

```text
Read the current case revision first, then repeat my last requested action once using that current state. Stop before any human approval.
```

### If ChatGPT cannot see the Velaire capabilities

1. Stop the recording attempt.
2. Reopen the correct role page inside that chat's built-in browser.
3. Do not close or navigate away from it.
4. Confirm the page says `AI assistance ready`.
5. Start a fresh take.

Do not try to fix missing page tools by naming a tool in the prompt. Tool selection is the product proof.

### If a private owner draft exists but the page has not updated

Wait two seconds for shared-state refresh. If it still does not appear, refresh that role page once, keeping its complete private URL intact. Do not click a case-queue link that drops the capability query.

### If ChatGPT prints a private URL

Stop the take. Delete that conversation or start a fresh chat before recording again. Never blur a capability token as an afterthought if a clean retake is possible.

## 6. Unattended judge path

You do not need to be online when judges test Velaire.

- Fast self-guided route: https://velaire-hvac.vercel.app/demo/customer?judge=1
- The visible judge simulator lets the judge act as the owner and exercise every human Send gate in one page.
- Full two-chat route: the judge opens a new customer case, copies the generated private owner invite into a second ChatGPT chat, and plays both human roles.
- Velaire does **not** currently contain an always-on owner agent, Slack bridge, email notification, or unsolicited ChatGPT wake-up. If the owner is absent, the case remains durable and the customer can ask ChatGPT to check again later.

This is intentional submission scope. A production notification worker or remote MCP server would extend availability, but it is not required to prove the page-native WebMCP interaction.

## 7. Final upload checklist

- Final cut is under three minutes.
- Every chat request sounds like a customer or owner request; no WebMCP tool name is spoken or pasted.
- Both role chats and both role pages appear at least once.
- One private draft is visibly staged before a human sends it.
- `AWAITING_HUMAN`, the booking receipt, and the pending changed-work decision are visible.
- The narration says the demo is synthetic and names the map/wait limitations.
- No `access=` query, account email, real address, payment data, or personal notification appears.
- Audio is clear and dead waits are removed without changing event order.
- The public app and repository URLs are shown in the video description, not spoken at length.

Official WebMCP behavior reference: https://learn.chatgpt.com/docs/webmcp

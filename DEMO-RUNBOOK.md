# Velaire — One-Take Three-Minute Demo Runbook

This is the canonical recording sheet for one continuous master take. Everything in square brackets is an operator instruction and must not be spoken.

Target spoken length: **2:40–2:50**. Record the complete workflow once, in its real order. If live model processing pushes the exported video past three minutes, remove only dead waiting silence; do not rearrange or restage the workflow.

The prompts deliberately contain no WebMCP tool names. Choosing the correct site capability from ordinary language is part of the demonstration.

## 1. Prepare the screen before recording

1. Put this runbook and the OBS controls on the unrecorded monitor.
2. On the recorded monitor, open two separate ChatGPT desktop windows:
   - `CUSTOMER — Velaire demo`;
   - `OWNER — Velaire demo`.
3. Maximize both windows and keep CUSTOMER in front. Switch roles during the take with `Alt+Tab`.
4. In each ChatGPT window, keep chat at roughly 32% width and the built-in browser at roughly 68%.
5. Leave both built-in browsers on a blank tab. The customer must begin from the first prompt, not from a manually opened website.
6. Collapse conversation history, hide the Windows taskbar, turn on Do Not Disturb, and remove the webcam overlay.
7. Place a permanent OBS privacy mask over the browser address row. The private owner capability token must never be readable in the recording.
8. Use only `Lincoln Park, Chicago, IL 60614`. Do not enter a real address, phone number, email, or payment information.
9. Reset the fictional demo before recording so no previous active case remains.
10. Keep this page open on the second monitor and copy each prompt only when its numbered step arrives.

## 2. Record one continuous take

Start OBS. Do not pause the recording. Do not begin with a title card.

### Step 1 — Begin in the CUSTOMER chat

**[ACTION: Paste and send CUSTOMER PROMPT 1.]**

```text
Open https://velaire-hvac.vercel.app. My AC is blowing warm air in 60614, I need help today between 2 and 4 PM, and I can spend up to $180. Check whether Velaire is a fit and show me its pricing, availability, and warranty evidence. If it is, open a synthetic request for Lincoln Park, Chicago. No surprise travel fee, and ask me before any added work. You may save only that neighborhood-level location to this synthetic case. Do not book anything.
```

**SAY:**

> Booking a home service seems simple—until the price changes, the schedule moves, or nobody remembers what was agreed. We built an interaction layer where a customer's AI and an owner's AI can work through one service request, while people control the commitment. Velaire is our HVAC example.
>
> I'll start like any customer: my AC is blowing warm air, I need help today, and I have a budget. I don't name a tool; I explain the problem. ChatGPT opens Velaire, discovers its WebMCP capabilities, checks service fit and evidence, and opens the request. Everything here is visibly synthetic.

**[OPTIONAL—say only if ChatGPT is still working:]**

> It's working through that request now, so I'll give it a second.

**[ACTION: When the result appears, show the evidence briefly, then show the new case, `Awaiting Provider`, revision 1, and the case code.]**

**SAY:**

> Now there is one versioned case, without payment or personal contact information.

### Step 2 — Start the customer wait and hand the case to the OWNER

**[ACTION: On the customer page, click `Copy owner invite`. Do not paste it into either visible chat. Then paste and send CUSTOMER PROMPT 2.]**

```text
Wait for the owner's reply on this case and summarize anything new. Keep checking for up to two minutes, then stop and tell me if no reply arrives. Do not approve or book anything.
```

**SAY:**

> Now I ask the customer agent to wait in short, cancellable rounds. While it checks, I'll move to the owner.

**[ACTION: Press `Alt+Tab` to OWNER. Click the built-in browser address field, paste the private invitation, press Enter, and wait for the matching case code. The permanent privacy mask must cover the URL.]**

**SAY:**

> This private invitation brings the same case into a completely separate owner session. In production, an authenticated business notification would deliver it; here, I'm handing it over directly.

### Step 3 — Prepare and send the first OWNER offer

**[ACTION: Paste and send OWNER PROMPT 1.]**

```text
Read this customer's request and prepare a $195 offer for today from 2 to 4 PM with a $49 deposit. Include the cooling diagnostic, labor, and written findings. Exclude parts and refrigerant, include a 30-day workmanship warranty, and stop before sending it.
```

**SAY:**

> This separate owner ChatGPT reads the request and prepares a $195 offer. The customer sees nothing yet: the draft is private, and the agent can't send it.

**[OPTIONAL—say only if the draft is still being prepared:]**

> The offer's coming together, but nothing has been sent.

**[ACTION: Show `PRIVATE DRAFT` and `AWAITING HUMAN`. Review the terms, then click `Human: send offer`.]**

**SAY AS YOU CLICK:**

> I review the terms and press Send. That human action publishes the offer and creates the next revision.

### Step 4 — Receive the offer and send the CUSTOMER counter

**[ACTION: Press `Alt+Tab` to CUSTOMER. If the waiting response has not finished, use the optional line below.]**

**[OPTIONAL—say only while waiting:]**

> I'll give the customer chat a second to catch up.

**[ACTION: When the $195 offer appears in the customer chat, paste and send CUSTOMER PROMPT 3.]**

```text
Show me what the owner offered, the case history, and the driving plan to Lincoln Park. Clearly separate planning estimates from live traffic. Then counter at $175 for the same 2-to-4 PM window with no after-hours surcharge. Do not accept anything.
```

**SAY:**

> And there it is, back in the customer's own ChatGPT. In one ordinary request, I ask for the history, a driving plan, and a $175 counter. The map link is real, but the travel range is explicitly synthetic—not live traffic or technician GPS. The customer can negotiate without accidentally accepting.

**[ACTION: Briefly show the route card and visual case history. Do not open the external map yet.]**

### Step 5 — Send the revised OWNER offer

**[ACTION: Press `Alt+Tab` to OWNER. Paste and send OWNER PROMPT 2.]**

```text
Read the customer's latest response. If the $175 counter is there, prepare a revised $175 offer for 2 to 4 PM with the same $49 deposit. Keep parts and refrigerant excluded, add no after-hours surcharge, and stop before sending it.
```

**SAY:**

> Back with the owner, the counter is already attached to the same case. The agent prepares the revision and, once again, the owner—not the AI—sends it.

**[ACTION: Show the $175 private draft, then click `Human: send offer`.]**

### Step 6 — Compare and confirm the agreement as the CUSTOMER

**[ACTION: Press `Alt+Tab` to CUSTOMER. Paste and send CUSTOMER PROMPT 4.]**

```text
Compare the original and revised offers. If the latest one is $175 for 2 to 4 PM, with a $49 deposit, no after-hours surcharge, and parts and refrigerant excluded, prepare that version for booking—but stop before approval.
```

**SAY:**

> ChatGPT compares the stored offers: $20 less, the same time and deposit, and no after-hours surcharge. It can prepare version two, but it can't accept it.

**[ACTION: Show `AWAITING HUMAN`. Review the displayed terms and click `I confirm these terms`.]**

**SAY AS YOU CLICK:**

> I confirm the terms myself, and Velaire locks them into an immutable demo receipt. No payment is taken, and no real appointment is booked.

### Step 7 — Propose changed work as the OWNER

**[ACTION: Press `Alt+Tab` to OWNER. Paste and send OWNER PROMPT 3.]**

```text
Read the confirmed booking. Prepare a $145 change order to replace a weak capacitor, adding about 30 minutes. Keep it separate from the accepted agreement, and stop before sending it.
```

**SAY:**

> Now the job changes. The owner finds a weak capacitor and proposes another $145. Velaire doesn't rewrite the accepted deal; it creates a separate change order.

**[ACTION: Show the private change-order draft, then click `Human: send change order`.]**

### Step 8 — Compare the change and close in the CUSTOMER view

**[ACTION: Press `Alt+Tab` to CUSTOMER. Paste and send CUSTOMER PROMPT 5.]**

```text
Compare the proposed change with my accepted receipt. Tell me the new total, whether the capacitor was included before, how the schedule changes, and what still needs my approval. Show me the updated case history. Do not accept or reject the change.
```

**SAY:**

> The customer agent checks the proposal against the accepted receipt: $175 plus $145 is $320. Parts were excluded, the visit is about 30 minutes longer, and the customer still decides.

**[ACTION: Show the comparison. Click `Open case graph`; hold briefly. Return and click `Google driving route`; hold briefly. Return to the pending change order for the last sentence.]**

**SAY:**

> We can open the agreement as a graph and hand the route to a real map provider. HVAC is only the example. This is a reusable agreement layer for service businesses: AI handles discovery, coordination, and comparison; people control every promise.

**[ACTION: Stop speaking. Hold for one second, then stop OBS.]**

## 3. One-take recovery lines

Use these only if the stated condition occurs. They are not part of the normal narration.

### The bounded wait ends before the owner reply appears

**SAY:**

> That wait ended cleanly, so I'm asking the same case for anything newer.

```text
Check this same case again now and summarize only what changed since the last revision. Do not approve anything.
```

### A stale revision is reported

**SAY:**

> The case changed while the agent was working, so it's re-reading the current version before trying again.

```text
Read the current case revision, then repeat my last request once using that revision. Stop before any human approval.
```

### ChatGPT cannot discover the page capabilities

End the recording and restart the take. Reopen the correct role page inside that chat's built-in browser and confirm the site displays `AI assistance ready`. Do not rescue the demonstration by naming internal tool functions.

### The owner page does not show the same case

End the recording and restart. Do not continue on `/demo/owner` without the complete private invitation, and never expose or narrate its `access=` value.

## 4. Expected evidence during the take

| Moment | What must appear | What it proves |
|---|---|---|
| Customer discovery | Service fit plus pricing, availability, and warranty evidence | Natural intent selected read capabilities |
| Case creation | `Awaiting Provider`, revision 1, case code | No booking or payment occurred |
| Owner draft | `$195`, `PRIVATE DRAFT`, `AWAITING HUMAN` | The agent cannot publish terms |
| Owner send | Offer V1 and a new revision | A human published the offer |
| Customer counter | `$175` counter and route card | Negotiation did not accept an offer |
| Revised offer | Offer V2 at `$175` | Prior terms remain comparable |
| Booking preparation | `AWAITING HUMAN` | The agent cannot approve or charge |
| Customer confirmation | `Booked` and `RCPT-…` | Accepted terms became a receipt |
| Changed work | Separate `+$145` change order | The original agreement was not rewritten |
| Final comparison | `$175 + $145 = $320`; parts excluded; decision required | The customer retains the final decision |
| Graph and route | Version history plus external map handoff | The agreement is inspectable and limitations remain explicit |

## 5. Submission boundary

The public site is https://velaire-hvac.vercel.app. All businesses, people, reviews, prices, credentials, bookings, receipts, and service records shown in the demonstration are fictional. The route link opens a real map provider, but the travel range is a planning fixture rather than live traffic, geocoding, technician GPS, or an arrival guarantee.

For unattended judging, use https://velaire-hvac.vercel.app/demo/customer?judge=1. The visible judge simulator can exercise the owner Send gates without requiring the creator to be online.

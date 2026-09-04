# Velaire — Three-Minute Demo Runbook

This is the canonical recording and editing sheet. Everything in brackets is an operator cue and must not be spoken.

Target final length: **2:45–2:58**. Record the workflow as short clips, remove model-processing silence, and preserve the real event order.

Use an optional wait line only while a response is visibly running. Keep no more than four of them in the final edit; remove every unused wait line first.

## The one-line product definition

> We built a WebMCP operating layer for service-business websites. Velaire Heating & Air is the HVAC demonstration.

The product is not an HVAC-only chatbot. It is a reusable pattern that lets a customer's agent and a business owner's agent discover, verify, negotiate, and audit one service agreement while the humans retain every commitment.

## 1. Screenshot verdict and final screen arrangement

The supplied two-window setup is correct for establishing that two independent agents exist:

- left: `CUSTOMER — Velaire demo`;
- right: `OWNER — Velaire demo`;
- both use GPT-5.6 Sol High;
- each has its own built-in browser.

Make these changes before recording:

1. Do not open on two blank browsers. Start with the customer request already being pasted. Use the side-by-side view only after the private owner page is connected, and optionally for the closing shot.
2. Maximize the active customer or owner window for every interaction clip so the chat and website remain readable after YouTube compression.
3. Auto-hide the Windows taskbar.
4. Remove the webcam overlay during workflow clips. If you want it, use it only for the first and last sentence at no more than 12% of the frame.
5. Collapse the ChatGPT history sidebar.
6. Keep the active chat at about 32% width and its built-in browser at about 68%.
7. Crop the browser address field whenever a private URL is loaded. Never show `access=`.
8. Keep the `Fictional demo` label visible whenever possible.

Use the second, unrecorded monitor for this runbook, the recorder controls, and the next paste prompt.

## 2. How the URLs actually work

You are correct that the customer should begin from a prompt. You do **not** need to type the public customer URL into the browser before the video.

The first customer prompt tells ChatGPT to open the public Velaire website. Once the page is open in ChatGPT's built-in browser, ChatGPT discovers the page's WebMCP capabilities and chooses among them from the customer's natural request.

The owner is different. A new service case creates a private owner invitation. That capability cannot be guessed from the public site. Open it off-camera in the owner chat's built-in browser, then record the owner interaction. Do not paste that private invitation into the visible chat history.

The agents do not call one another. Each role page reads and writes the same durable, revisioned service case.

## 3. Before recording

- Leave the customer and owner chats open exactly as shown in the screenshot.
- Leave both built-in browsers on a blank tab.
- Confirm both chats use GPT-5.6 Sol or Terra.
- Turn on Do Not Disturb.
- Close email, Slack, WhatsApp, password managers, and personal tabs.
- Use only the synthetic area `Lincoln Park, Chicago, IL 60614`.
- Do not use a real address, phone number, email, or payment information.
- Prepare one OBS scene for both chats and one readable full-screen scene for each role.

## 4. Exact clip plan, paste prompts, and narration

The prompts intentionally contain no WebMCP tool names. Selecting the correct capability from natural intent is part of the proof.

### Clip 1 — Customer discovers the business immediately

**Final position:** 00:00–00:30

**[ACTION: Start on the maximized CUSTOMER window and immediately paste customer prompt C1. Do not use a title card or show both blank browsers.]**

```text
Open https://velaire-hvac.vercel.app. My AC is blowing warm air in 60614 and I need help today under $180. Can this business help? Show me its pricing, availability, and warranty evidence. Do not book anything.
```

**SAY WHILE CHATGPT OPENS THE PAGE:**

> Booking a home service seems simple—until the price changes, the schedule moves, or nobody remembers what was agreed. We built an interaction layer for service websites where the customer's AI and the owner's AI can work through one request, while people control the commitment. Velaire Heating & Air is our HVAC example.
>
> I'll start like any customer: my AC is blowing warm air, I need help today, and I have a budget. I don't name a tool. ChatGPT opens Velaire, discovers its WebMCP capabilities, and returns service fit, pricing, availability, and warranty evidence. Everything is visibly synthetic for this demo.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> It's checking now, so I'll give it a second.

**[EDIT: Remove only silent model-processing time. Hold for one second on the returned evidence.]**

### Clip 2 — Customer opens the shared request

**Final position:** 00:30–00:48

**[ACTION: Paste customer prompt C2.]**

```text
Create a synthetic service request for today from 2 to 4 PM using Lincoln Park, Chicago as my confirmed service area. No surprise travel fee, and ask me before any added work. Do not book anything.
```

**SAY:**

> That's enough to continue. I ask it to open a request, and Velaire creates a shared, versioned case with what the owner needs—but no payment or contact information—plus a private owner invitation.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> That shared case is being created now.

**[ACTION: Show `Awaiting Provider`, revision 1, and the case code. End this clip before copying the private invitation.]**

### Private handoff — never include this in the video

1. Copy the owner invitation from the customer page.
2. Open it directly in the OWNER chat's built-in browser.
3. Confirm the owner page shows the same case code and revision 1.
4. Crop or hide the browser address field.

### Clip 3 — Customer waits while the owner responds

**Final position:** 00:48–00:56

**[ACTION: Return to CUSTOMER and paste C3.]**

```text
Wait briefly for the owner’s first reply and summarize it when it arrives. Stop after two minutes and tell me honestly if nothing changes. Do not approve anything.
```

**SAY:**

> Now ChatGPT waits for a reply in short, cancellable rounds. It won't pretend to wait forever. While it checks, I'll move to the owner.

**OPTIONAL TRANSITION LINE — 2–3 SECONDS:**

> While it checks, I'll switch to the owner.

**[ACTION: Once waiting begins, cut to the maximized OWNER window.]**

### Clip 4 — Owner agent stages; owner human sends

**Final position:** 00:56–01:18

**[ACTION: First show the connected CUSTOMER and OWNER windows side by side for two seconds. Then maximize OWNER and paste owner prompt O1.]**

```text
Read the customer’s request. Prepare a $195 offer for today from 2 to 4 PM with a $49 deposit. Include the cooling diagnostic, labour, and written findings. Exclude parts and refrigerant, and include a 30-day workmanship warranty. Stop before sending it.
```

**SAY:**

> This is a separate ChatGPT session on the private owner page. It reads the request and prepares a $195 offer. But the customer sees nothing yet: the draft is private, and the agent can't send it.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> The offer's coming together, but nothing has been sent.

**[ACTION: Hold on `PRIVATE DRAFT` and `AWAITING HUMAN`. Click `Human: send offer`.]**

**SAY AS YOU CLICK:**

> I'm acting as the owner, so I review the terms and press Send. That publishes the offer and creates the next revision.

**OPTIONAL TRANSITION LINE — 2–3 SECONDS:**

> I'll give the customer chat a second to catch up.

### Clip 5 — Customer receives, visualizes, routes, and counters

**Final position:** 01:18–01:42

**[ACTION: Cut back to CUSTOMER. The waiting response should now contain the $195 offer. Paste C4.]**

```text
Show me the current case history and the driving plan to my confirmed synthetic area. Clearly separate any planning estimate from live traffic. Then counter at $175 with the same 2-to-4 PM window and no after-hours surcharge. Do not accept anything.
```

**SAY:**

> And there it is, back in the customer's ChatGPT. In one ordinary request, I ask for the history, a driving plan, and a $175 counter. The map link is real, but the travel range is explicitly synthetic—not live traffic or technician GPS. The customer can negotiate without accidentally accepting.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> The counter is going onto the shared case now.

**[ACTION: Briefly show the visual history and route card. Do not open the map yet.]**

### Clip 6 — Owner receives the counter and sends revision two

**Final position:** 01:42–01:59

**[ACTION: Cut to OWNER and paste O2.]**

```text
Check the customer’s latest reply. If they countered, prepare a revised $175 offer with the same 2-to-4 PM window and $49 deposit. Keep parts and refrigerant excluded, and add no after-hours surcharge. Stop before sending it.
```

**SAY:**

> Back with the owner, the counter is already on the same case. The agent prepares the revision; the owner sends it.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> It's preparing the new terms now.

**[ACTION: Show the $175 private draft. Click `Human: send offer`.]**

### Clip 7 — Compare, prepare, and confirm the exact agreement

**Final position:** 01:59–02:22

**[ACTION: Cut to CUSTOMER and paste C5.]**

```text
Compare the first and revised offers. Prepare the latest one for booking, but stop before approval.
```

**SAY:**

> ChatGPT compares the stored offers: $20 less, the same window and deposit, and no after-hours surcharge. It can prepare version two, but it can't accept it. I confirm the terms, and Velaire locks them into an immutable demo receipt. No payment is taken, and no real appointment is booked.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> There's the receipt; the accepted promise is now fixed.

**[ACTION: Show the comparison and `AWAITING HUMAN`. Click `I confirm these terms`. Then paste C6.]**

```text
Show me the complete accepted receipt. Do not change the case.
```

**[ACTION: Hold for one second on the $175 receipt.]**

### Clip 8 — Changed work is compared with the accepted promise

**Final position:** 02:22–02:46

**[ACTION: Cut to OWNER and paste O3.]**

```text
Read the confirmed booking. Prepare a $145 changed-work request for a capacitor part replacement because a weak capacitor was found. State that it adds about 30 minutes. Stop before sending it.
```

**SAY:**

> Now the job changes. The owner finds a weak capacitor and proposes another $145. Velaire doesn't rewrite the accepted deal; it creates a separate change order.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> I'll give the customer side a second to catch up.

**[ACTION: Show the private changed-work draft. Click `Human: send change order`. Cut to CUSTOMER and paste C7.]**

```text
Compare the changed-work request with what I accepted. Tell me the proposed total, whether this part was included before, and what still requires my decision. Show the current visual history. Do not accept or reject the change.
```

**SAY:**

> The customer agent checks that against the receipt: $175 plus $145 is $320. Parts were excluded, the visit is 30 minutes longer, and the customer still decides.

**OPTIONAL WAIT LINE — 2–3 SECONDS:**

> Nothing changes until the customer makes that decision.

### Clip 9 — Graph, map, and closing statement

**Final position:** 02:46–02:57

**[ACTION: Open `Open case graph`; hold for two seconds. Open `Google driving route`; hold for two seconds. Return to the pending changed-work card. Use the side-by-side agent scene for the final sentence if time allows.]**

**SAY:**

> We can open the whole agreement as a graph and hand the route to a real map provider. HVAC is only the example. This is a reusable agreement layer for service businesses: AI handles coordination and comparison; people control every promise.

**[ACTION: Stop. Do not add an improvised closing.]**

## 5. Expected proof

| Moment | Expected result | Boundary proved |
|---|---|---|
| Service discovery | Matching service plus pricing, availability, and warranty evidence | Read-only; synthetic sources identified |
| New request | `Awaiting Provider`, revision 1 | No booking or payment |
| Owner stages offer | `$195`, `PRIVATE DRAFT`, `AWAITING HUMAN` | Customer cannot see the draft |
| Owner sends | Offer V1, revision 2 | Only the human publishes |
| Customer counters | `$175`, revision 3 | No offer accepted |
| Owner sends revision | Offer V2, revision 4 | Separate sent version preserved |
| Booking preparation | `AWAITING HUMAN`, revision 5 | Agent cannot confirm or charge |
| Customer confirmation | `Booked`, revision 6, `RCPT-…` | Human creates immutable receipt |
| Changed work | `+$145`, then `Change Pending`, revision 7 | Receipt remains unchanged |
| Comparison | `$175 + $145 = $320`; parts excluded; decision required | Agent cannot accept or reject |
| Route | West Town to Lincoln Park; 15–30 minute synthetic band | No live traffic, GPS, or arrival promise |

## 6. Exact on-screen captions

Use only these short overlays; do not add explanatory paragraphs to the video.

| Clip | Overlay |
|---|---|
| Customer discovery | `A NORMAL REQUEST → STRUCTURED SITE ACTIONS` |
| Two-role reveal | `TWO AGENTS · ONE VERSIONED CASE` |
| Private owner draft | `AGENT PREPARES · HUMAN SENDS` |
| Booking gate | `NO AGENT APPROVAL · NO PAYMENT` |
| Changed work | `ACCEPTED $175 + PROPOSED $145 = $320` |
| Close | `EVERY PROMISE HAS A VERSION + RECEIPT` |

## 7. Recovery prompts

Use these only if required.

### Wait ended before a reply

```text
Check this same case again now. Summarize only what changed since the last revision.
```

### Stale revision

```text
Read the current case revision first, then repeat my last requested action once. Stop before any human approval.
```

### ChatGPT cannot use the site

Stop the clip. Reopen the correct role page inside that chat's built-in browser, confirm `AI assistance ready`, and retry. Do not solve missing page capabilities by naming an implementation tool in the prompt.

### Private draft does not appear immediately

Wait two seconds. If necessary, refresh the role page once while preserving its complete private URL.

## 8. Unattended judge path

You do not need to be online when judges test Velaire.

- Self-guided route: https://velaire-hvac.vercel.app/demo/customer?judge=1
- The visible judge simulator lets one judge exercise the owner Send gates without waiting for you.
- For the full proof, a judge can create a case, open its private owner invitation in a second ChatGPT chat, and play both human roles.
- There is no always-on owner agent, Slack bridge, or unsolicited ChatGPT wake-up in this submission. A durable case can be checked again later.

Official WebMCP behavior reference: https://learn.chatgpt.com/docs/webmcp

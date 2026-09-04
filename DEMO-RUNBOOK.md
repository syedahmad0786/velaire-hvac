# Velaire — Three-Minute Demo Runbook

This is the canonical recording and editing sheet. Everything in brackets is an operator cue and must not be spoken.

Target final length: **2:45–2:58**. Record the workflow as short clips, remove model-processing silence, and preserve the real event order.

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

> We built a WebMCP operating layer for service-business websites, demonstrated here through Velaire Heating & Air. I start with a normal customer request and the public business URL. ChatGPT opens the page, discovers its capabilities, and selects the right ones. The answer returns service fit and dated evidence, all clearly marked synthetic.

**[EDIT: Remove only silent model-processing time. Hold for one second on the returned evidence.]**

### Clip 2 — Customer opens the shared request

**Final position:** 00:30–00:48

**[ACTION: Paste customer prompt C2.]**

```text
Create a synthetic service request for today from 2 to 4 PM using Lincoln Park, Chicago as my confirmed service area. No surprise travel fee, and ask me before any added work. Do not book anything.
```

**SAY:**

> The second request creates one shared, versioned case. It collects bounded service details—not payment or personal contact data—and creates a separate private invitation for the owner.

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

> The customer agent waits in short, cancellable rounds. This is deliberately bounded to two minutes; it is not a permanent subscription or background wake-up.

**[ACTION: Once waiting begins, cut to the maximized OWNER window.]**

### Clip 4 — Owner agent stages; owner human sends

**Final position:** 00:56–01:18

**[ACTION: First show the connected CUSTOMER and OWNER windows side by side for two seconds. Then maximize OWNER and paste owner prompt O1.]**

```text
Read the customer’s request. Prepare a $195 offer for today from 2 to 4 PM with a $49 deposit. Include the cooling diagnostic, labour, and written findings. Exclude parts and refrigerant, and include a 30-day workmanship warranty. Stop before sending it.
```

**SAY:**

> This is a separate owner ChatGPT using the private invitation. Its agent can prepare exact terms, but the draft remains invisible to the customer. Staging does not advance the agreement.

**[ACTION: Hold on `PRIVATE DRAFT` and `AWAITING HUMAN`. Click `Human: send offer`.]**

**SAY AS YOU CLICK:**

> Only this visible owner action publishes the offer and advances the case to revision two.

### Clip 5 — Customer receives, visualizes, routes, and counters

**Final position:** 01:18–01:42

**[ACTION: Cut back to CUSTOMER. The waiting response should now contain the $195 offer. Paste C4.]**

```text
Show me the current case history and the driving plan to my confirmed synthetic area. Clearly separate any planning estimate from live traffic. Then counter at $175 with the same 2-to-4 PM window and no after-hours surcharge. Do not accept anything.
```

**SAY:**

> The first customer call receives the owner's revision in its own chat. Velaire also returns a visual case history and route-ready links. The fifteen-to-thirty-minute travel band is synthetic—there is no live traffic, GPS, geocoding, or guaranteed arrival. The customer sends a counter without accepting an offer.

**[ACTION: Briefly show the visual history and route card. Do not open the map yet.]**

### Clip 6 — Owner receives the counter and sends revision two

**Final position:** 01:42–01:59

**[ACTION: Cut to OWNER and paste O2.]**

```text
Check the customer’s latest reply. If they countered, prepare a revised $175 offer with the same 2-to-4 PM window and $49 deposit. Keep parts and refrigerant excluded, and add no after-hours surcharge. Stop before sending it.
```

**SAY:**

> The owner agent retrieves the customer's counter from the same durable case. It prepares a revised offer, but again waits for the owner to send it.

**[ACTION: Show the $175 private draft. Click `Human: send offer`.]**

### Clip 7 — Compare, prepare, and confirm the exact agreement

**Final position:** 01:59–02:22

**[ACTION: Cut to CUSTOMER and paste C5.]**

```text
Compare the first and revised offers. Prepare the latest one for booking, but stop before approval.
```

**SAY:**

> The comparison uses stored terms, not screenshots: twenty dollars less, with the same time and deposit. Preparing returns awaiting human. I confirm the displayed version myself, producing an immutable synthetic receipt without payment or a real appointment.

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

> Additional work becomes a separate change order instead of silently rewriting the accepted agreement.

**[ACTION: Show the private changed-work draft. Click `Human: send change order`. Cut to CUSTOMER and paste C7.]**

```text
Compare the changed-work request with what I accepted. Tell me the proposed total, whether this part was included before, and what still requires my decision. Show the current visual history. Do not accept or reject the change.
```

**SAY:**

> Against the receipt, one hundred seventy-five plus one hundred forty-five becomes three hundred twenty dollars. Parts were excluded, thirty minutes are added, and the customer still decides.

### Clip 9 — Graph, map, and closing statement

**Final position:** 02:46–02:57

**[ACTION: Open `Open case graph`; hold for two seconds. Open `Google driving route`; hold for two seconds. Return to the pending changed-work card. Use the side-by-side agent scene for the final sentence if time allows.]**

**SAY:**

> This is the pattern for service-industry websites: agents discover, verify, communicate, and prepare; humans approve; every promise remains versioned and auditable.

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

# Velaire — Natural One-Take Demo Runbook

This is one continuous walkthrough using two independent ChatGPT chats. The customer and owner prompts are intentionally conversational. They never name an internal WebMCP tool, case revision, schema field, or implementation detail.

## One honest boundary before recording

The current demonstration does not pretend to have a production owner account or a public inbox. Each new case creates a private owner capability link. After the customer opens a case, paste that link into the OWNER chat's built-in browser. From that point onward, the owner can naturally ask the website whether any new request needs attention.

In a production deployment, an authenticated notification would open the same owner workspace. Do not claim that this demo has Slack, email delivery, or a global owner inbox.

## Screen setup

- Open two separate ChatGPT windows: `CUSTOMER — Velaire demo` and `OWNER — Velaire demo`.
- Maximize each window and switch with `Alt+Tab`; do not divide the recorded monitor into four narrow columns.
- Keep chat at roughly 32% width and its built-in browser at roughly 68%.
- Start with both built-in browsers blank. The first customer prompt opens the public website.
- Keep this runbook on the unrecorded monitor or your phone.
- Put a permanent privacy mask over the browser address bar before recording. Never expose the private `access=` value.
- Use only the fictional area `Lincoln Park, Chicago, IL 60614`.
- Do not enter a real address, phone number, email, or payment information.
- Record one uninterrupted master take. If necessary, remove only dead response time afterward.

## The one-take walkthrough

### 1. CUSTOMER asks a normal discovery question

Paste this into the CUSTOMER chat:

```text
Open https://velaire-hvac.vercel.app in the built-in browser. My AC is blowing warm air, and I'm in Lincoln Park, Chicago 60614. Can this company help me today? Tell me what their pricing, availability, and warranty actually say.
```

Say:

> Booking a home service is simple until the price changes or new work appears. Velaire is an HVAC example of a website that works with the AI the customer already uses. I won't feed ChatGPT tools or form fields; I'll ask what a customer would ask.

If the response is still running, say:

> It's checking the site now, so I'll give it a moment.

When the result appears, say:

> The site supplies its services, price range, availability, warranty, and sources. Everything here is synthetic.

### 2. CUSTOMER decides to ask for service

Paste:

```text
Okay, ask them for a visit today between 2 and 4. I'd like to stay under $180, I don't want a surprise travel fee, and they need to ask me before any extra work. Save only Lincoln Park as my service area. Don't book anything.
```

Say:

> This is a follow-up, not another form. ChatGPT carries the problem forward and opens a structured request without booking or collecting payment details.

When the case appears, show `Awaiting Provider`, revision 1, and the case code. Click `Copy owner invite`.

### 3. CUSTOMER waits for the business

Paste:

```text
Let me know when the business replies. Keep checking this case for up to two minutes, but don't approve or book anything.
```

Say:

> The customer agent waits in short rounds. While it checks, I'll move to the owner.

Press `Alt+Tab` to OWNER. Paste the private invitation into the OWNER chat's built-in browser address bar and open it. The privacy mask must hide the URL.

Say:

> This is a separate ChatGPT session. The private invitation opens the same case for the owner, so I don't copy the customer's story into its prompt.

### 4. OWNER checks what came in

Paste this into the OWNER chat:

```text
Check the Velaire owner portal that's open beside this chat. Are there any new customer requests? Tell me what came in and what needs my attention. Don't reply or prepare anything yet.
```

Say:

> A real owner starts by asking what needs attention. The agent reads the portal and summarizes the new request.

### 5. OWNER makes the business decision

After ChatGPT summarizes the request, paste:

```text
Okay. Prepare a $195 offer for that customer using the time they requested. Use our usual $49 deposit and 30-day workmanship warranty, and keep parts and refrigerant separate. Let me review it before anything is sent.
```

Say:

> Now I make the business decision: $195. The agent combines that with the request and site policies, but only creates a private draft.

If the draft is still being prepared, say:

> It's preparing the offer, but the customer still can't see it.

Show `PRIVATE DRAFT` and `AWAITING HUMAN`. Review the terms and click `Human: send offer`.

Say as you click:

> I review the terms and press Send. Only that human action makes them visible.

### 6. CUSTOMER receives the offer and negotiates

Press `Alt+Tab` to CUSTOMER. The original waiting request should receive the owner's reply.

If necessary, say:

> I'll give the customer chat a second to pick up the reply.

Then paste:

```text
What did they offer? Show me the important terms, the case so far, and how they would reach Lincoln Park. Be clear if the travel time is only an estimate. Since it's over my $180 budget, ask whether they'll do $175 for the same time with no after-hours surcharge. Don't accept anything.
```

Say:

> The reply arrives in the customer's ChatGPT. The agent explains it, shows the route and history, and sends the counter. The map is real; the travel time is clearly an estimate.

### 7. OWNER checks the response and revises the offer

Press `Alt+Tab` to OWNER and paste:

```text
Check that customer request again. If they replied with a $175 counter, I'm okay with it. Update the offer and keep the deposit, warranty, timing, and exclusions the same. Let me review it before you send it.
```

Say:

> I don't restate the counter. The owner agent retrieves it from the case, prepares the revision, and preserves the first offer for comparison.

Show the revised private draft and click `Human: send offer`.

### 8. CUSTOMER compares and confirms

Press `Alt+Tab` to CUSTOMER and paste:

```text
Compare this with the first offer. If it matches the $175 deal I asked for and nothing else got worse, prepare it for booking—but don't confirm it.
```

Say:

> ChatGPT compares the stored terms, sees the lower price without worse conditions, and prepares the offer. It still can't accept it for me.

When `AWAITING HUMAN` appears, review the terms and click `I confirm these terms`.

Say:

> I confirm it myself. Velaire locks the terms into a receipt; no payment or real appointment occurs.

### 9. OWNER introduces changed work

Press `Alt+Tab` to OWNER and paste:

```text
Check whether that customer accepted the offer and tell me exactly what was agreed. We have now found a weak capacitor. If the booking is confirmed, prepare a separate $145 change request for replacing it and add about 30 minutes. Don't change the original agreement, and don't send anything yet.
```

Say:

> When the job changes, the agent checks the accepted agreement and creates a separate change request. It never rewrites the original deal.

Show the private change-order draft and click `Human: send change order`.

### 10. CUSTOMER checks the change against the promise

Press `Alt+Tab` to CUSTOMER and paste:

```text
What changed from the deal I accepted? Show me the new total, whether the capacitor was included before, and what I still need to decide. Don't approve or reject it. Then show me the complete case history and the driving route to my service area, and clearly label anything that's only an estimate.
```

Say:

> The agent compares the change with the receipt: $175 plus $145 is $320, the part was excluded, and the customer still decides.

Open the case graph, then the external route, and return to the pending change request.

Finish with:

> The graph shows the whole agreement, and the route hands off to a real map. HVAC is the example; the product is a reusable service-agreement layer. AI handles coordination and comparison, while people control every promise.

Hold for one second and stop recording.

## If the wait ends before the reply arrives

Say:

> That waiting round ended cleanly, so I'm checking the same case again.

Paste:

```text
Check this same case again and tell me only what changed. Don't approve anything.
```

## Proof that must remain visible

- The customer and owner are separate ChatGPT sessions.
- Both websites are open inside their respective built-in browsers.
- The owner discovers the customer request from the site before receiving any offer instructions.
- No prompt names an internal WebMCP tool.
- Owner drafts remain private until the owner presses Send.
- Booking remains blocked until the customer confirms on the page.
- Changed work remains separate from the accepted receipt.
- Synthetic evidence and route limitations remain visible.

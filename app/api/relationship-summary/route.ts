type MeetingNote = {
  conferenceName: string;
  date: string;
  company: string;
  note: string;
  interest?: string;
};

type RequestBody = {
  personName: string;
  meetings: MeetingNote[];
};

function providerError() {
  return Response.json(
    {
      configured: true,
      error: "The summary service could not complete this request.",
    },
    { status: 502 },
  );
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return Response.json({ error: "Invalid request JSON." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return Response.json({ error: "Invalid request JSON." }, { status: 400 });
  }

  if (typeof body.personName !== "string" || !Array.isArray(body.meetings)) {
    return Response.json({ error: "Invalid request JSON." }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ configured: false });
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const meetings = body.meetings;
  const meetingLines = meetings
    .map((meeting) => {
      if (!meeting || typeof meeting !== "object") return "";
      const interestLabel =
        meeting.interest === "not_now"
          ? "Not now"
          : meeting.interest === "interested"
            ? "Interested"
            : "Interest not recorded";
      const date = typeof meeting.date === "string" ? meeting.date.slice(0, 40) : "";
      const conferenceName =
        typeof meeting.conferenceName === "string" ? meeting.conferenceName.slice(0, 200) : "";
      const company = typeof meeting.company === "string" ? meeting.company.slice(0, 200) : "";
      const note = typeof meeting.note === "string" ? meeting.note.slice(0, 1000) : "";
      return `- ${date} at ${conferenceName} (${company}), ${interestLabel}: ${note}`;
    })
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You help Grain sales reps. Grain sells embedded cross-currency / FX risk tools to PSPs, travel wholesalers, cross-border payments, and treasury teams.
Given meeting notes for one person, say how the relationship actually changed, and one next action.
Be conservative and evidence-based. Do not infer progress, warming, buying intent, or a stakeholder unless a note contains a concrete buying signal: a pricing question, a demo request, an introduction to an internal stakeholder, a timeline, a named owner, or an agreed next step.
Repeated vague requests such as "send info", "circle back", or "send more info" are not progress, even if the rep marked Interested. Repeated "Not now" together with only those vague notes means the relationship is stalled, with no meaningful progression. Say stalled plainly. Do not describe it as warming, interested, or moving forward.
If the notes are too thin to judge (blank, a greeting, or "met briefly" with no buying signal), say there is not enough information. Do not invent intent.
If an earlier concrete signal is followed by "Not now" and only a vague request, call that cooling or contradictory. Do not treat the earlier signal as continued progress.
A warming relationship requires those concrete signals, and the notes getting more specific across meetings.
Next action rules:
- Warming: nextAction only carries out the concrete signal already written in the notes. Do not add a new question, owner, or meeting that the notes do not contain.
- Stalled, insufficient, contradictory, or cooling: nextAction is exactly one direct qualification question (a yes/no on a concrete need, owner, or timeline), then the words "If there is still no concrete intent, deprioritize and pause." Do not suggest sending more info, booking a demo, or another meeting.
Respond with JSON only: {"whatChanged":"...","nextAction":"..."}. Keep the combined text about 80 words.`;

  const personName = body.personName.slice(0, 200);
  const userPrompt = `Person: ${personName}\nMeetings:\n${meetingLines}`;

  try {
    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
      },
    );

    if (!openAiResponse.ok) {
      return providerError();
    }

    const openAiData = (await openAiResponse.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = openAiData.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as {
      whatChanged?: string;
      nextAction?: string;
    };

    if (!parsed.whatChanged?.trim() || !parsed.nextAction?.trim()) {
      return providerError();
    }

    return Response.json({
      configured: true,
      whatChanged: parsed.whatChanged,
      nextAction: parsed.nextAction,
    });
  } catch {
    return providerError();
  }
}

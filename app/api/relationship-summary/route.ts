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

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return Response.json({ configured: false });
  }
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const meetingLines = (body.meetings ?? [])
    .map((meeting) => {
      const interestLabel =
        meeting.interest === "not_now"
          ? "Not now"
          : meeting.interest === "interested"
            ? "Interested"
            : "Interest not recorded";
      return `- ${meeting.date} at ${meeting.conferenceName} (${meeting.company}), ${interestLabel}: ${meeting.note}`;
    })
    .join("\n");

  const systemPrompt = `You help Grain sales reps. Grain sells embedded cross-currency / FX risk tools to PSPs, travel wholesalers, cross-border payments, and treasury teams.
Given meeting notes for one person, say how the relationship actually changed, and one next action.
Be conservative and evidence-based. Do not infer progress, warming, or buying intent unless a note contains a concrete buying signal: a pricing question, a demo request, an introduction to an internal stakeholder, a timeline, a named owner, or an agreed next step.
Repeated vague requests such as "send info", "circle back", or "send more info" are not progress. Repeated "Not now" together with only those vague notes means the relationship is stalled, with no meaningful progression. Say that plainly. Do not describe it as warming or moving forward.
A warming relationship requires those concrete signals, and the notes getting more specific across meetings.
If the notes never advance, the next action is a direct ask or stop. Do not invent a stakeholder, commitment, or next meeting that is not in the notes.
Respond with JSON only: {"whatChanged":"...","nextAction":"..."}. Keep the combined text about 80 words.`;

  const userPrompt = `Person: ${body.personName}\nMeetings:\n${meetingLines}`;

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

type HubSpotRequestBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  conferenceName?: string;
  note?: string;
};

const emptyPayload = {
  email: "",
  firstName: "",
  lastName: "",
  company: "",
  conferenceName: "",
  note: "",
};

function notSent(reason: string, payload = emptyPayload) {
  return Response.json({ sent: false, reason, payload });
}

export async function POST(request: Request) {
  let body: HubSpotRequestBody;
  try {
    body = (await request.json()) as HubSpotRequestBody;
  } catch {
    return notSent("Invalid request JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return notSent("Invalid request JSON.");
  }

  const payload = {
    email: typeof body.email === "string" ? body.email : "",
    firstName: typeof body.firstName === "string" ? body.firstName : "",
    lastName: typeof body.lastName === "string" ? body.lastName : "",
    company: typeof body.company === "string" ? body.company : "",
    conferenceName: typeof body.conferenceName === "string" ? body.conferenceName : "",
    note: typeof body.note === "string" ? body.note : "",
  };

  const email = payload.email.trim();
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN?.trim();

  if (!email) {
    return notSent("Email is required to create a HubSpot contact.", payload);
  }

  if (!accessToken) {
    return notSent("HUBSPOT_ACCESS_TOKEN is not configured.", payload);
  }

  try {
    const hubSpotResponse = await fetch(
      "https://api.hubapi.com/crm/v3/objects/contacts",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          properties: {
            email,
            firstname: payload.firstName,
            lastname: payload.lastName,
            company: payload.company,
          },
        }),
      },
    );

    if (hubSpotResponse.status === 409) {
      return notSent("This email is already a HubSpot contact.", payload);
    }

    if (!hubSpotResponse.ok) {
      return notSent("HubSpot could not create this contact.", payload);
    }

    return Response.json({ sent: true, payload });
  } catch {
    return notSent("HubSpot could not be reached.", payload);
  }
}

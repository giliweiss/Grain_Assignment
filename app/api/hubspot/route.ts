type HubSpotRequestBody = {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  conferenceName?: string;
  note?: string;
};

export async function POST(request: Request) {
  const body = (await request.json()) as HubSpotRequestBody;
  const payload = {
    email: body.email ?? "",
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    company: body.company ?? "",
    conferenceName: body.conferenceName ?? "",
    note: body.note ?? "",
  };

  const email = payload.email.trim();
  const accessToken = process.env.HUBSPOT_ACCESS_TOKEN;

  if (!email) {
    return Response.json({
      sent: false,
      reason: "Email is required to create a HubSpot contact.",
      payload,
    });
  }

  if (!accessToken) {
    return Response.json({
      sent: false,
      reason: "HUBSPOT_ACCESS_TOKEN is not configured.",
      payload,
    });
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

    if (!hubSpotResponse.ok) {
      const errorText = await hubSpotResponse.text();
      return Response.json({
        sent: false,
        reason: `HubSpot API error (${hubSpotResponse.status}): ${errorText.slice(0, 300)}`,
        payload,
      });
    }

    return Response.json({ sent: true, payload });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown HubSpot request error";
    return Response.json({
      sent: false,
      reason: `HubSpot request failed: ${message}`,
      payload,
    });
  }
}

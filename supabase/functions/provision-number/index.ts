import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELNYX_API_URL = "https://api.telnyx.com/v2/available_phone_numbers";

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "POST request required"
        }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const body = await req.json();

    const country = body.country || "US";
    const areaCode = body.area_code || null;
    const limit = Math.min(Number(body.limit || 10), 20);

    if (country !== "US") {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Currently only United States numbers are enabled."
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const apiKey = Deno.env.get("TELNYX_API_KEY");

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "TELNYX_API_KEY is not configured."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const params = new URLSearchParams();

    params.set("filter[country_code]", country);
    params.set("filter[features]", "sms");
    params.set("page[size]", String(limit));

    if (areaCode) {
      params.set("filter[national_destination_code]", String(areaCode));
    }

    const telnyxResponse = await fetch(
      `${TELNYX_API_URL}?${params.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json"
        }
      }
    );

    const telnyxData = await telnyxResponse.json();

    if (!telnyxResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: telnyxData?.errors || "Telnyx number search failed.",
          telnyx_status: telnyxResponse.status
        }),
        {
          status: telnyxResponse.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const numbers = (telnyxData.data || []).map((item: any) => ({
      id: item.id || null,
      phone_number: item.phone_number || null,
      country: country,
      features: item.features || [],
      cost_information: item.cost_information || null
    }));

    return new Response(
      JSON.stringify({
        success: true,
        country,
        count: numbers.length,
        numbers
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error)
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});

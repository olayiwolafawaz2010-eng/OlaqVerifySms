import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Only POST requests are allowed",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const TELNYX_API_KEY = Deno.env.get("TELNYX_API_KEY");

    if (!TELNYX_API_KEY) {
      throw new Error(
        "TELNYX_API_KEY is missing from Supabase Edge Function secrets"
      );
    }

    let body: any;

    try {
      body = await req.json();
    } catch {
      throw new Error("Request body must be valid JSON");
    }

    const countryCode = String(
      body?.country_code || "US"
    )
      .trim()
      .toUpperCase();

    if (!/^[A-Z]{2}$/.test(countryCode)) {
      throw new Error(
        "country_code must be a valid 2-letter country code, for example US"
      );
    }

    const url =
      "https://api.telnyx.com/v2/available_phone_numbers" +
      `?filter[country_code]=${encodeURIComponent(countryCode)}` +
      "&filter[phone_number_type]=local" +
      "&filter[limit]=5";

    const telnyxResponse = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TELNYX_API_KEY}`,
        Accept: "application/json",
      },
    });

    let telnyxData: any;

    try {
      telnyxData = await telnyxResponse.json();
    } catch {
      telnyxData = null;
    }

    if (!telnyxResponse.ok) {
      const detail =
        telnyxData?.errors?.[0]?.detail ||
        telnyxData?.errors?.[0]?.title ||
        "Telnyx number search failed";

      return new Response(
        JSON.stringify({
          success: false,
          error: detail,
        }),
        {
          status: telnyxResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const rawNumbers = Array.isArray(telnyxData?.data)
      ? telnyxData.data
      : [];

    const numbers = rawNumbers.map((item: any) => ({
      phone_number: item?.phone_number || null,
      id: item?.id || null,
      record_type: item?.record_type || null,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        country_code: countryCode,
        count: numbers.length,
        numbers,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown server error";

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

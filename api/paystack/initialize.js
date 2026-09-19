export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      message: "Method not allowed"
    });
  }

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const { email, amount } = req.body || {};

    if (!secretKey) {
      return res.status(500).json({
        ok: false,
        message: "Paystack is not configured."
      });
    }

    if (!email || !amount) {
      return res.status(400).json({
        ok: false,
        message: "Email and amount are required."
      });
    }

    const nairaAmount = Number(amount);

    if (!Number.isFinite(nairaAmount) || nairaAmount < 100) {
      return res.status(400).json({
        ok: false,
        message: "Minimum deposit is ₦100."
      });
    }

    const reference =
      "OLAQ_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2, 9);

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secretKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          amount: Math.round(nairaAmount * 100),
          currency: "NGN",
          reference,
          callback_url:
            `${process.env.APP_URL || ""}/?payment=callback`
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(400).json({
        ok: false,
        message: data.message || "Unable to initialize payment."
      });
    }

    return res.status(200).json({
      ok: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Payment initialization failed."
    });
  }
}

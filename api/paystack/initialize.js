export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { email, amount } = req.body || {};

    if (!email || !amount) {
      return res.status(400).json({
        error: "Email and amount are required"
      });
    }

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          amount: Math.round(Number(amount) * 100),
          currency: "NGN"
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(400).json({
        error: data.message || "Paystack initialization failed"
      });
    }

    return res.status(200).json({
      status: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference
    });

  } catch (error) {
    console.error("Paystack error:", error);

    return res.status(500).json({
      error: "Server error while initializing payment"
    });
  }
}

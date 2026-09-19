export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "Method not allowed"
    });
  }

  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const reference = req.query.reference;

    if (!secretKey) {
      return res.status(500).json({
        ok: false,
        message: "Paystack is not configured."
      });
    }

    if (!reference) {
      return res.status(400).json({
        ok: false,
        message: "Payment reference is required."
      });
    }

    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${secretKey}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(400).json({
        ok: false,
        message: data.message || "Unable to verify payment."
      });
    }

    const transaction = data.data;

    if (transaction.status !== "success") {
      return res.status(400).json({
        ok: false,
        paid: false,
        status: transaction.status
      });
    }

    return res.status(200).json({
      ok: true,
      paid: true,
      reference: transaction.reference,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      message: "Payment verification failed."
    });
  }
}

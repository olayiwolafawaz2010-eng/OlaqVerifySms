const numbers = [
  {
    id: "test-us-001",
    country: "United States",
    countryCode: "US",
    number: "+1 TEST NUMBER",
    price: 800,
    available: true
  },
  {
    id: "test-ng-001",
    country: "Nigeria",
    countryCode: "NG",
    number: "+234 TEST NUMBER",
    price: 500,
    available: true
  },
  {
    id: "test-uk-001",
    country: "United Kingdom",
    countryCode: "GB",
    number: "+44 TEST NUMBER",
    price: 950,
    available: true
  }
];

export default function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      ok: false,
      message: "Method not allowed"
    });
  }

  return res.status(200).json({
    ok: true,
    numbers
  });
}

import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { type, listingId } = await req.json();

    const price = type === "feature" ? 1000 : 500;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!siteUrl) {
      return NextResponse.json(
        { error: "NEXT_PUBLIC_SITE_URL is missing" },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      metadata: {
        type,
        listingId,
        },
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: type === "feature" ? "Feature Listing" : "Boost Listing",
            },
            unit_amount: price,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/payment-success?type=${type}&listingId=${listingId}`,
      cancel_url: `${siteUrl}/my-listings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
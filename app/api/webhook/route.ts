import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // 🔥 important
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature failed");
    return new Response("Webhook Error", { status: 400 });
  }

  // 🎯 Handle successful payment
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const type = session.metadata?.type;
    const listingId = session.metadata?.listingId;

    if (type && listingId) {
      if (type === "feature") {
        await supabase
          .from("listings")
          .update({ is_featured: true })
          .eq("id", listingId);
      }

      if (type === "boost") {
        const boostExpiry = new Date();
        boostExpiry.setDate(boostExpiry.getDate() + 7);

        await supabase
          .from("listings")
          .update({ boost_until: boostExpiry.toISOString() })
          .eq("id", listingId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
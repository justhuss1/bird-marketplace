import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey || !webhookSecret || !supabaseUrl || !serviceRoleKey) {
    return new Response("Missing required environment variables", {
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey);
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return new Response("Webhook Error", { status: 400 });
  }

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
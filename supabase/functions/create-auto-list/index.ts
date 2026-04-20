import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { listName, items, budget, storeIds, currencySymbol } = await req.json();

    console.log("Creating auto list for user:", user.id);
    console.log("Request:", { listName, items, budget, storeIds, currencySymbol });

    // Fetch all products and prices for selected stores
    const { data: storePrices, error: pricesError } = await supabaseClient
      .from("store_prices")
      .select("product_gtin, price, in_stock, store_id, products(description)")
      .in("store_id", storeIds)
      .eq("in_stock", true);

    if (pricesError) {
      console.error("Error fetching store prices:", pricesError);
      throw pricesError;
    }

    console.log(`Found ${storePrices?.length || 0} products across selected stores`);

    if (!storePrices || storePrices.length === 0) {
      return new Response(
        JSON.stringify({ error: "No products found in the selected stores" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prepare products data for AI
    const productsData = storePrices.map((sp: any) => ({
      gtin: sp.product_gtin,
      description: sp.products?.description || "Unknown product",
      price: sp.price,
      store_id: sp.store_id,
    }));

    // Call Lovable AI to create optimized list
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are a shopping assistant that helps users create optimized shopping lists.
Given a list of desired items, a budget, and available products with prices from multiple stores, your task is to:
1. Match the desired items to available products
2. Select products that best fit the budget
3. Try to get as close to the budget as possible without exceeding it
4. Prioritize getting all requested items if possible
5. If budget doesn't allow all items, prioritize essential items

Return your response as a JSON object with this structure:
{
  "selectedProducts": [
    {
      "gtin": "product_gtin",
      "description": "product description",
      "price": 123.45,
      "store_id": "store_uuid",
      "quantity": 1
    }
  ],
  "totalCost": 456.78,
  "reasoning": "Brief explanation of choices made"
}`;

    const userPrompt = `Create a shopping list with these requirements:

Items wanted: ${items}
Budget: ${currencySymbol}${budget}

Available products:
${JSON.stringify(productsData, null, 2)}

Select the best products that match the requested items and fit within the budget.`;

    console.log("Calling Lovable AI...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI service requires payment. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiResult = JSON.parse(aiData.choices[0].message.content);

    console.log("AI result:", aiResult);

    // Create shopping list
    const { data: newList, error: listError } = await supabaseClient
      .from("shopping_lists")
      .insert({
        user_id: user.id,
        name: listName,
        budget: budget,
      })
      .select()
      .single();

    if (listError) {
      console.error("Error creating list:", listError);
      throw listError;
    }

    console.log("Created list:", newList.id);

    // Add items to list
    const listItems = aiResult.selectedProducts.map((product: any) => ({
      shopping_list_id: newList.id,
      product_gtin: product.gtin,
      quantity: product.quantity || 1,
    }));

    const { error: itemsError } = await supabaseClient
      .from("shopping_list_items")
      .insert(listItems);

    if (itemsError) {
      console.error("Error adding items to list:", itemsError);
      throw itemsError;
    }

    console.log(`Added ${listItems.length} items to list`);

    return new Response(
      JSON.stringify({
        success: true,
        listId: newList.id,
        totalCost: aiResult.totalCost,
        reasoning: aiResult.reasoning,
        itemsCount: listItems.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in create-auto-list:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

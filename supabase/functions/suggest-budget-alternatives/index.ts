import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.77.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { listItems, budget, currencySymbol } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all products and their prices for context
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('gtin, description');
    
    if (productsError) throw productsError;

    // Fetch prices for all products
    const { data: allPrices, error: pricesError } = await supabase
      .from('store_prices')
      .select('product_gtin, price, in_stock')
      .eq('in_stock', true);
    
    if (pricesError) throw pricesError;

    // Build a map of products with their average prices
    const productPriceMap = new Map();
    allPrices?.forEach((price: any) => {
      if (!productPriceMap.has(price.product_gtin)) {
        productPriceMap.set(price.product_gtin, []);
      }
      productPriceMap.get(price.product_gtin).push(price.price);
    });

    const productsWithPrices = allProducts?.map((product: any) => {
      const prices = productPriceMap.get(product.gtin) || [];
      const avgPrice = prices.length > 0 
        ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length 
        : 0;
      return {
        gtin: product.gtin,
        description: product.description,
        avgPrice: avgPrice.toFixed(2)
      };
    }).filter((p: any) => p.avgPrice > 0);

    // Get current list with prices
    const currentListWithPrices = await Promise.all(
      listItems.map(async (item: any) => {
        const { data: prices } = await supabase
          .from('store_prices')
          .select('price, in_stock')
          .eq('product_gtin', item.product.gtin)
          .eq('in_stock', true);
        
        const avgPrice = prices && prices.length > 0
          ? prices.reduce((sum: number, p: any) => sum + Number(p.price), 0) / prices.length
          : 0;
        
        return {
          gtin: item.product.gtin,
          description: item.product.description,
          quantity: item.quantity,
          avgPrice: avgPrice.toFixed(2)
        };
      })
    );

    const currentTotal = currentListWithPrices.reduce(
      (sum: number, item: any) => sum + (Number(item.avgPrice) * item.quantity), 
      0
    );

    // Prepare AI prompt
    const prompt = `You are a shopping budget optimizer. A user has a shopping list that costs ${currencySymbol}${currentTotal.toFixed(2)} but their budget is ${currencySymbol}${budget}.

Current shopping list:
${currentListWithPrices.map((item: any) => `- ${item.description} (Qty: ${item.quantity}, Avg Price: ${currencySymbol}${item.avgPrice})`).join('\n')}

Available alternative products with prices:
${productsWithPrices.slice(0, 200).map((p: any) => `- ${p.description} (GTIN: ${p.gtin}, Avg Price: ${currencySymbol}${p.avgPrice})`).join('\n')}

Suggest alternative products to meet the budget. Consider:
1. Smaller package sizes (e.g., 2L → 1L, 1kg → 500g)
2. Alternative brands that are cheaper
3. Similar products with lower prices

Return ONLY a JSON array of suggested items in this exact format:
[
  {
    "gtin": "product_gtin_code",
    "description": "product description",
    "quantity": number,
    "reason": "brief reason for suggestion"
  }
]

Make sure the total cost is at or below ${currencySymbol}${budget}. Try to keep the same number of items or similar items where possible.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a helpful shopping assistant that provides JSON responses only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error('AI suggestion failed');
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;
    
    // Extract JSON from response (handle potential markdown code blocks)
    let suggestions;
    try {
      const jsonMatch = aiContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(aiContent);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Failed to parse AI suggestions');
    }

    // Calculate prices for suggestions
    const suggestionsWithPrices = await Promise.all(
      suggestions.map(async (item: any) => {
        const { data: prices } = await supabase
          .from('store_prices')
          .select('price, in_stock')
          .eq('product_gtin', item.gtin)
          .eq('in_stock', true);
        
        const avgPrice = prices && prices.length > 0
          ? prices.reduce((sum: number, p: any) => sum + Number(p.price), 0) / prices.length
          : 0;
        
        return {
          ...item,
          avgPrice: avgPrice.toFixed(2)
        };
      })
    );

    const suggestedTotal = suggestionsWithPrices.reduce(
      (sum: number, item: any) => sum + (Number(item.avgPrice) * item.quantity), 
      0
    );

    return new Response(
      JSON.stringify({
        currentList: currentListWithPrices,
        currentTotal: currentTotal.toFixed(2),
        suggestedList: suggestionsWithPrices,
        suggestedTotal: suggestedTotal.toFixed(2),
        savings: (currentTotal - suggestedTotal).toFixed(2)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in suggest-budget-alternatives:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
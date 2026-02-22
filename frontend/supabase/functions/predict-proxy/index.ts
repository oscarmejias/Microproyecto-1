import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_URL = "http://3.90.232.44:8050/api/v1/predict";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    console.log("Sending to API:", JSON.stringify(body).substring(0, 200));

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const responseText = await response.text();
    console.log("API status:", response.status, "body length:", responseText.length);
    console.log("API response preview:", responseText.substring(0, 500));

    if (!response.ok) {
      return new Response(
        JSON.stringify({
          error: `API responded with ${response.status}`,
          details: responseText,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "API did not return valid JSON", raw: responseText }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Unwrap array if needed
    const root = Array.isArray(data) ? data[0] : data;
    const pred = root?.prediction?.[0];

    // Save to DB if we have a valid prediction and input
    if (pred && body?.inputs?.[0]) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const sb = createClient(supabaseUrl, supabaseKey);

        const input = body.inputs[0];
        const features = input.features || {};
        const studentInfo = input.student_info || {};
        const academic = input.academic_context || {};

        const row = {
          batch_id: academic.batch_id || null,
          student_id: studentInfo.student_id || null,
          student_name: studentInfo.name || null,
          course: academic.course || null,
          semester: academic.semester || null,
          age_at_enrollment: features.age_at_enrollment ?? null,
          gender: features.gender ?? null,
          displaced: features.displaced ?? null,
          debtor: features.debtor ?? null,
          tuition_fees_up_to_date: features.tuition_fees_up_to_date ?? null,
          scholarship_holder: features.scholarship_holder ?? null,
          cu_1st_sem_enrolled: features.curricular_units_1st_sem_enrolled ?? null,
          cu_1st_sem_approved: features.curricular_units_1st_sem_approved ?? null,
          cu_1st_sem_grade: features.curricular_units_1st_sem_grade ?? null,
          cu_2nd_sem_enrolled: features.curricular_units_2nd_sem_enrolled ?? null,
          cu_2nd_sem_approved: features.curricular_units_2nd_sem_approved ?? null,
          cu_2nd_sem_grade: features.curricular_units_2nd_sem_grade ?? null,
          outcome: pred.outcome || null,
          risk_score: pred.risk_score ?? null,
          risk_level: pred.risk_level || null,
          dropout_prob: pred.class_probabilities?.Dropout ?? pred.risk_score ?? null,
          graduate_prob: pred.class_probabilities?.Graduate ?? null,
          recommendation: pred.recommendation || null,
          intervention: pred.intervention_steps || null,
        };

        const { error: insertError } = await sb.from("predictions").insert([row]);
        if (insertError) {
          console.error("DB insert error:", insertError);
        } else {
          console.log("Prediction saved to DB for student:", row.student_id);
        }
      } catch (dbErr) {
        console.error("DB save failed (non-blocking):", dbErr);
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Proxy error", details: String(err) }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

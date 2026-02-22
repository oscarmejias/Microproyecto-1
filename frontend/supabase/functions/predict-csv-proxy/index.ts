import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const API_CSV_URL = "http://3.90.232.44:8050/api/v1/predict/csv";

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
    const { csv_content, batch_id } = await req.json();

    if (!csv_content) {
      return new Response(
        JSON.stringify({ error: "csv_content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Sending CSV to API, batch_id:", batch_id, "length:", csv_content.length);

    // Send CSV as multipart/form-data with "file" field
    const formData = new FormData();
    const blob = new Blob([csv_content], { type: "text/csv" });
    formData.append("file", blob, "students.csv");

    const response = await fetch(API_CSV_URL, {
      method: "POST",
      body: formData,
    });

    const responseText = await response.text();
    console.log("API CSV status:", response.status, "body length:", responseText.length);
    console.log("API CSV response preview:", responseText.substring(0, 500));

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `API responded with ${response.status}`, details: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return new Response(
        JSON.stringify({ error: "API did not return valid JSON", raw: responseText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unwrap array if needed
    const root = Array.isArray(data) ? data[0] : data;
    const predictions = root?.prediction ?? [];

    // Parse CSV to get input data for each student
    const csvLines = csv_content.trim().split(/\r?\n/);
    const delimiter = csvLines[0].includes(";") ? ";" : ",";
    const headers = csvLines[0].split(delimiter).map((h: string) => h.trim().replace(/^"|"$/g, ""));

    // Save each prediction to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const rows: any[] = [];
    for (let i = 0; i < predictions.length; i++) {
      const pred = predictions[i];
      // Parse CSV row for input data
      const csvRowIdx = i + 1; // skip header
      let inputData: Record<string, string> = {};
      if (csvRowIdx < csvLines.length) {
        const vals = csvLines[csvRowIdx].split(delimiter).map((v: string) => v.trim().replace(/^"|"$/g, ""));
        headers.forEach((h: string, idx: number) => {
          if (idx < vals.length) inputData[h] = vals[idx];
        });
      }

      const row = {
        batch_id: batch_id || inputData.batch_id || "unknown",
        student_id: pred.student_id || inputData.student_id || `ST-${i}`,
        student_name: inputData.name || null,
        course: inputData.course || null,
        semester: inputData.semester ? parseInt(inputData.semester) : null,
        age_at_enrollment: inputData.age_at_enrollment ? parseInt(inputData.age_at_enrollment) : null,
        gender: inputData.gender ? parseInt(inputData.gender) : null,
        displaced: inputData.displaced ? parseInt(inputData.displaced) : null,
        debtor: inputData.debtor ? parseInt(inputData.debtor) : null,
        tuition_fees_up_to_date: inputData.tuition_fees_up_to_date ? parseInt(inputData.tuition_fees_up_to_date) : null,
        scholarship_holder: inputData.scholarship_holder ? parseInt(inputData.scholarship_holder) : null,
        cu_1st_sem_enrolled: inputData.curricular_units_1st_sem_enrolled ? parseInt(inputData.curricular_units_1st_sem_enrolled) : null,
        cu_1st_sem_approved: inputData.curricular_units_1st_sem_approved ? parseInt(inputData.curricular_units_1st_sem_approved) : null,
        cu_1st_sem_grade: inputData.curricular_units_1st_sem_grade ? parseFloat(inputData.curricular_units_1st_sem_grade) : null,
        cu_2nd_sem_enrolled: inputData.curricular_units_2nd_sem_enrolled ? parseInt(inputData.curricular_units_2nd_sem_enrolled) : null,
        cu_2nd_sem_approved: inputData.curricular_units_2nd_sem_approved ? parseInt(inputData.curricular_units_2nd_sem_approved) : null,
        cu_2nd_sem_grade: inputData.curricular_units_2nd_sem_grade ? parseFloat(inputData.curricular_units_2nd_sem_grade) : null,
        outcome: pred.outcome || null,
        risk_score: pred.risk_score ?? null,
        risk_level: pred.risk_level || null,
        dropout_prob: pred.class_probabilities?.Dropout ?? pred.risk_score ?? null,
        graduate_prob: pred.class_probabilities?.Graduate ?? null,
        recommendation: pred.recommendation || null,
        intervention: pred.intervention_steps || null,
      };
      rows.push(row);
    }

    if (rows.length > 0) {
      const { error: insertError } = await sb.from("predictions").insert(rows);
      if (insertError) {
        console.error("DB insert error:", insertError);
      } else {
        console.log(`Inserted ${rows.length} predictions into DB`);
      }
    }

    return new Response(JSON.stringify({ predictions, metadata: root?.metadata }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("CSV Proxy error:", err);
    return new Response(
      JSON.stringify({ error: "Proxy error", details: String(err) }),
      { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ============================================================
// SUPABASE CONFIG — fill these in from your Supabase project
// Project Settings -> API -> Project URL / anon public key
// ============================================================
const SUPABASE_URL = "https://jgcizjhzvpzhptmblnfv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpnY2l6amh6dnB6aHB0bWJsbmZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY2NDA0NTcsImV4cCI6MjEwMjIxNjQ1N30.q_9aAmMND-TzsAzldDg8G5_i_V2Ozx0LPyjm5wihbFg";

// supabase-js is loaded via CDN in each page (see <script> tag order)
// NOTE: named "supabaseClient" (not "supabase") because the CDN library
// itself already sets window.supabase — declaring a top-level const/let
// with that same name throws "Can't create duplicate variable that
// shadows a global property: 'supabase'" in the browser.
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

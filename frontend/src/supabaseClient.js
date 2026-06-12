import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsb3p4dWh4Y3lodHl6eGFxemZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0NjcxMzAsImV4cCI6MjA5MTA0MzEzMH0.GMYWPH3M_iE9h5obaT_krPtWY9o32z69MUWN6-TfXKI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
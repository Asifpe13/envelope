/**
 * Public Supabase client config (anon key is designed to be public).
 * Used when VITE_SUPABASE_* env vars are missing — e.g. Cursor/grok.bot publish builds
 * where .env is gitignored and VITE_* secrets cannot be bound.
 * Never put the service_role key here.
 */
export const SUPABASE_PUBLIC_URL = 'https://wiznbwjvyjkjvbnzhdcf.supabase.co'
export const SUPABASE_PUBLIC_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpem5id2p2eWpranZibnpoZGNmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2ODQ4OTUsImV4cCI6MjExMTI2MDg5NX0.CLplkdoqMf_LvnwTgUL-rHeiQMOsk-e7bVrWH82j_J0'

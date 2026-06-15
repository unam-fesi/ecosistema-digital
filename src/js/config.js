/**
 * Configuración de Supabase
 * Este archivo contiene la configuración del cliente de Supabase
 */

var SUPABASE_URL = 'https://risatbuqolklefvjgngb.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2F0YnVxb2xrbGVmdmpnbmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNjc0MzUsImV4cCI6MjA4OTc0MzQzNX0.PTDGmpihCPd5iz8ZhbcUOMbGNuS4mi1sCD5linrVGvY';

// Inicializar cliente de Supabase (sobrescribe la referencia del SDK con el cliente)
var supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Alias global para compatibilidad
window.supabaseClient = supabaseClient;

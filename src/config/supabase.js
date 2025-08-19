const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://vuiobnbomffyakrtujqo.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1aW9ibmJvbWZmeWFrcnR1anFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MTc3NzAsImV4cCI6MjA3MDA5Mzc3MH0._UqXpkPdHZQpOohmP7e6LtEKHZQOujdNBc-3E21hThs';

const supabase = createClient(supabaseUrl, supabaseKey);

const connectDB = async () => {
  try {
    // Test the connection by checking if we can access the service
    const { data, error } = await supabase.from('repositories').select('id').limit(1);
    
    if (error && error.code !== '42P01') { // 42P01 is "relation does not exist"
      throw error;
    }
    
    console.log('📊 Supabase Connected Successfully');
    return supabase;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  // Supabase doesn't need explicit disconnection
  console.log('📊 Supabase connection closed');
};

module.exports = { supabase, connectDB, disconnectDB };

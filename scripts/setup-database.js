const { supabase, connectDB, disconnectDB } = require('../src/config/supabase');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🔧 Setting up Supabase database...');
    
    await connectDB();
    console.log('✅ Connected to Supabase');

    // Check if required tables exist
    const tablesToCheck = ['users', 'repositories', 'assignments'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { error } = await supabase.from(tableName).select('*').limit(1);
        if (error && error.code === '42P01') {
          console.log(`⚠️  Table '${tableName}' does not exist. Please run database migrations first.`);
        } else {
          console.log(`✅ Table '${tableName}' exists and is accessible`);
        }
      } catch (error) {
        console.log(`⚠️  Could not check table '${tableName}': ${error.message}`);
      }
    }

    // Test basic operations
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'test@example.com')
        .single();

      if (existingUser) {
        console.log('👤 Test user already exists');
      } else if (process.env.NODE_ENV === 'development') {
        // Create test user for development (this will require the users table to exist)
        console.log('👤 Creating test user...');
        console.log('⚠️  Note: This requires implementing the users table and password hashing first');
        
        // Uncomment when users table is created:
        /*
        const { data: testUser, error } = await supabase
          .from('users')
          .insert([{
            email: 'test@example.com',
            password: 'password123', // Remember to hash in production!
            first_name: 'Test',
            last_name: 'User',
            is_email_verified: false,
            is_active: true
          }])
          .select()
          .single();

        if (error) {
          console.log('⚠️  Test user creation failed:', error.message);
        } else {
          console.log('👤 Test user created: test@example.com');
        }
        */
      }
    } catch (error) {
      console.log('⚠️  Test user operations skipped:', error.message);
    }

    console.log('🎉 Database setup complete!');
    console.log('📋 Next steps:');
    console.log('   1. Implement user authentication with Supabase Auth');
    console.log('   2. Create database tables using Supabase migrations');
    console.log('   3. Implement password hashing with bcrypt');
    console.log('   4. Set up Row Level Security (RLS) policies');
    
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

setupDatabase();

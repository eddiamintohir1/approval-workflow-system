import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupSuperAdmin() {
  const email = 'eddie.amintohir@compawnion.co';
  const password = 'Ucompawnion2026#77#';

  console.log('Setting up super admin user...');
  console.log('Email:', email);

  try {
    // First, try to get the user by email
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError.message);
      process.exit(1);
    }

    const existingUser = users.users.find(u => u.email === email);

    if (existingUser) {
      console.log('User already exists. Updating password...');
      
      // Update the user's password
      const { data, error } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          password,
          email_confirm: true,
        }
      );

      if (error) {
        console.error('Error updating user:', error.message);
        process.exit(1);
      }

      console.log('✅ Super admin password updated successfully!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
    } else {
      console.log('Creating new user...');
      
      // Create user with admin service role key
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: 'Eddie Amintohir',
        }
      });

      if (error) {
        console.error('Error creating user:', error.message);
        process.exit(1);
      }

      console.log('✅ Super admin user created successfully!');
      console.log('User ID:', data.user.id);
      console.log('Email:', data.user.email);
    }

    console.log('\nYou can now sign in with:');
    console.log('Email:', email);
    console.log('Password: [provided password]');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

setupSuperAdmin();

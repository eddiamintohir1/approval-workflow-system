#!/usr/bin/env node

/**
 * Setup WorkMail Password in AWS Secrets Manager
 * 
 * This script stores a user's WorkMail password in AWS Secrets Manager
 * so the WFMT system can send emails from their address.
 * 
 * Usage:
 *   node scripts/setup-workmail-password.mjs <email> <password>
 * 
 * Example:
 *   node scripts/setup-workmail-password.mjs eddie.amintohir@compawnion.co MySecurePassword123
 */

import { 
  SecretsManagerClient, 
  CreateSecretCommand,
  UpdateSecretCommand,
  ResourceNotFoundException
} from "@aws-sdk/client-secrets-manager";

// AWS Configuration
const AWS_REGION = process.env.AWS_REGION || "us-west-2";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

// Validate environment variables
if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
  console.error("❌ Error: AWS credentials not found in environment variables");
  console.error("   Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY");
  process.exit(1);
}

// Initialize Secrets Manager client
const client = new SecretsManagerClient({
  region: AWS_REGION,
  credentials: {
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Store or update WorkMail password in Secrets Manager
 */
async function setWorkmailPassword(email, password) {
  const secretName = `workmail/user/${email}`;
  
  console.log(`\n🔐 Storing WorkMail password for: ${email}`);
  console.log(`📍 Secret name: ${secretName}`);
  console.log(`🌍 Region: ${AWS_REGION}\n`);
  
  try {
    // Try to update existing secret
    const updateCommand = new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: password,
    });
    
    await client.send(updateCommand);
    console.log(`✅ Successfully updated WorkMail password for ${email}`);
    console.log(`   Secret ID: ${secretName}`);
    
  } catch (error) {
    if (error instanceof ResourceNotFoundException) {
      // Secret doesn't exist, create it
      console.log(`📝 Secret not found, creating new secret...`);
      
      const createCommand = new CreateSecretCommand({
        Name: secretName,
        SecretString: password,
        Description: `WorkMail SMTP password for ${email} (WFMT System)`,
        Tags: [
          { Key: "Application", Value: "WFMT" },
          { Key: "Purpose", Value: "WorkMail-SMTP" },
          { Key: "Email", Value: email },
        ],
      });
      
      await client.send(createCommand);
      console.log(`✅ Successfully created WorkMail password secret for ${email}`);
      console.log(`   Secret ID: ${secretName}`);
      
    } else {
      throw error;
    }
  }
  
  console.log(`\n✨ Done! The WFMT system can now send emails from ${email}\n`);
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error(`
❌ Error: Missing required arguments

Usage:
  node scripts/setup-workmail-password.mjs <email> <password>

Example:
  node scripts/setup-workmail-password.mjs eddie.amintohir@compawnion.co MySecurePassword123

Arguments:
  <email>     Your WorkMail email address (e.g., eddie.amintohir@compawnion.co)
  <password>  Your WorkMail password (the one you use to login to Outlook)

Notes:
  - The password is stored securely in AWS Secrets Manager
  - The password is encrypted at rest
  - Only the WFMT application can access it
  - You can update the password anytime by running this script again
    `);
    process.exit(1);
  }
  
  const [email, password] = args;
  
  // Validate email format
  if (!email.includes('@')) {
    console.error(`❌ Error: Invalid email format: ${email}`);
    process.exit(1);
  }
  
  // Validate password (not empty)
  if (!password || password.trim().length === 0) {
    console.error(`❌ Error: Password cannot be empty`);
    process.exit(1);
  }
  
  try {
    await setWorkmailPassword(email, password);
  } catch (error) {
    console.error(`\n❌ Failed to store WorkMail password:`);
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }
}

// Run the script
main();

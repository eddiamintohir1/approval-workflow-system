/**
 * AWS Secrets Manager Helper
 * 
 * Manages WorkMail user passwords stored in AWS Secrets Manager
 * Secret naming convention: workmail/user/{email}
 */

import { 
  SecretsManagerClient, 
  GetSecretValueCommand,
  CreateSecretCommand,
  UpdateSecretCommand,
  ResourceNotFoundException
} from "@aws-sdk/client-secrets-manager";

// Initialize Secrets Manager client
const client = new SecretsManagerClient({
  region: process.env.AWS_REGION || "us-west-2",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Get WorkMail password for a user
 * @param email User's email address (e.g., eddie.amintohir@compawnion.co)
 * @returns User's WorkMail password
 * @throws Error if secret not found or retrieval fails
 */
export async function getWorkmailPassword(email: string): Promise<string> {
  const secretName = `workmail/user/${email}`;
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    
    if (!response.SecretString) {
      throw new Error(`Secret ${secretName} has no value`);
    }
    
    // Secret is stored as plain string (just the password)
    return response.SecretString;
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException) {
      throw new Error(
        `WorkMail password not found for ${email}. ` +
        `Please run the setup script to store the password in Secrets Manager.`
      );
    }
    throw new Error(`Failed to retrieve WorkMail password for ${email}: ${error.message}`);
  }
}

/**
 * Store or update WorkMail password for a user
 * @param email User's email address
 * @param password User's WorkMail password
 */
export async function setWorkmailPassword(email: string, password: string): Promise<void> {
  const secretName = `workmail/user/${email}`;
  
  try {
    // Try to update existing secret
    const updateCommand = new UpdateSecretCommand({
      SecretId: secretName,
      SecretString: password,
    });
    await client.send(updateCommand);
    console.log(`✅ Updated WorkMail password for ${email}`);
  } catch (error: any) {
    if (error instanceof ResourceNotFoundException) {
      // Secret doesn't exist, create it
      const createCommand = new CreateSecretCommand({
        Name: secretName,
        SecretString: password,
        Description: `WorkMail password for ${email}`,
        Tags: [
          { Key: "Application", Value: "WFMT" },
          { Key: "Purpose", Value: "WorkMail-SMTP" },
        ],
      });
      await client.send(createCommand);
      console.log(`✅ Created WorkMail password secret for ${email}`);
    } else {
      throw new Error(`Failed to set WorkMail password for ${email}: ${error.message}`);
    }
  }
}

/**
 * Check if WorkMail password exists for a user
 * @param email User's email address
 * @returns true if password exists, false otherwise
 */
export async function hasWorkmailPassword(email: string): Promise<boolean> {
  try {
    await getWorkmailPassword(email);
    return true;
  } catch {
    return false;
  }
}

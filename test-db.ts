import { testDatabaseConnection, verifyDatabaseSchema, testDatabaseOperations } from './src/database';

async function runDatabaseTest() {
  console.log('🔍 Starting database connection test...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const connectionTest = await testDatabaseConnection();
    console.log('Connection result:', connectionTest);

    if (!connectionTest.success) {
      console.log('❌ Database connection failed.');
      return;
    }

    // Verify database schema
    console.log('\n2. Verifying database schema...');
    const schemaCheck = await verifyDatabaseSchema();
    console.log('Schema verification:', schemaCheck);

    // Test database operations
    console.log('\n3. Testing database operations...');
    const operationsCheck = await testDatabaseOperations();
    console.log('Operations test:', operationsCheck);

    console.log('\n✅ Database test completed!');
  } catch (error) {
    console.error('❌ Database test failed:', error);
  }
}

runDatabaseTest();

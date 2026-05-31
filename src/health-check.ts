import { testDatabaseConnection, verifyDatabaseSchema, testDatabaseOperations } from './database';

export async function runHealthCheck() {
  console.log('🔍 Starting comprehensive health check...\n');

  const healthReport = {
    timestamp: new Date().toISOString(),
    database: {
      connection: false,
      schema: {
        merchants: false,
        drivers: false,
        orders: false,
        postgis: false
      },
      operations: {
        insert: false,
        select: false,
        update: false,
        spatial: false
      }
    },
    overall: 'unhealthy'
  };

  // Test database connection
  console.log('1. Testing database connection...');
  const connectionTest = await testDatabaseConnection();
  healthReport.database.connection = connectionTest.success;

  if (!connectionTest.success) {
    console.log('❌ Database connection failed. Stopping health check.');
    healthReport.overall = 'unhealthy';
    return healthReport;
  }

  // Verify database schema
  console.log('\n2. Verifying database schema...');
  const schemaCheck = await verifyDatabaseSchema();
  healthReport.database.schema = schemaCheck;

  // Test database operations
  console.log('\n3. Testing database operations...');
  const operationsCheck = await testDatabaseOperations();
  healthReport.database.operations = operationsCheck;

  // Determine overall health
  const allSchemaTables = Object.values(schemaCheck).filter(val => val === true).length >= 3;
  const allOperationsWork = Object.values(operationsCheck).filter(val => val === true).length >= 3;

  if (healthReport.database.connection && allSchemaTables && allOperationsWork) {
    healthReport.overall = 'healthy';
    console.log('\n✅ Overall system health: HEALTHY');
  } else {
    healthReport.overall = 'degraded';
    console.log('\n⚠️ Overall system health: DEGRADED');
  }

  return healthReport;
}

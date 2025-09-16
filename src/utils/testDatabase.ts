// Test MySQL database connection and functionality
import { apiClient, checkApiConnection } from '../lib/api';
import { checkDatabaseConnection } from './initDatabase';

export async function testDatabaseSetup() {
  console.log('🧪 Testing MySQL database setup...');
  
  try {
    // Test 1: Check connection
    console.log('1. Testing database connection...');
    const isConnected = await checkDatabaseConnection();
    
    if (!isConnected) {
      console.warn('⚠️ MySQL database connection failed, using localStorage fallback');
      return { success: false, message: 'Database connection failed' };
    }
    
    console.log('✅ MySQL database connection successful');
    
    // Test 2: Test table access
    console.log('2. Testing table access...');
    const destinations = await apiClient.get('destinations');
    
    if (!destinations) {
      console.error('❌ Failed to access destinations table');
      return { success: false, message: 'Table access failed' };
    }
    
    console.log('✅ Table access successful');
    
    // Test 3: Test insert operation
    console.log('3. Testing insert operation...');
    const testData = {
      name: 'Test Destination',
      description: 'This is a test destination',
      price: 1000
    };
    
    const insertResult = await apiClient.create('destinations', testData);
    
    if (!insertResult) {
      console.error('❌ Failed to insert test data');
      return { success: false, message: 'Insert operation failed' };
    }
    
    console.log('✅ Insert operation successful');
    
    // Test 4: Test delete operation (cleanup)
    console.log('4. Cleaning up test data...');
    try {
      await apiClient.delete('destinations', insertResult.id);
      console.log('✅ Test data cleaned up');
    } catch (deleteError) {
      console.warn('⚠️ Failed to cleanup test data:', deleteError);
    }
    
    console.log('🎉 All MySQL database tests passed!');
    return { success: true, message: 'MySQL database setup is working correctly' };
    
  } catch (error) {
    console.error('❌ MySQL database test failed:', error);
    return { success: false, message: 'Database test failed' };
  }
}

// Function to run tests on app startup
export function runDatabaseTests() {
  // Run tests after a short delay to ensure app is loaded
  setTimeout(() => {
    testDatabaseSetup().then(result => {
      if (result.success) {
        console.log('🚀 Database is ready for use!');
      } else {
        console.log('🔄 Falling back to localStorage mode');
      }
    });
  }, 2000);
}

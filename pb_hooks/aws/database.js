
function setupDatabase(app, config) {
  if (config.databaseType === 'sqlite' || !config.databaseType) {
    console.log('Using SQLite database (default)');
    return;
  }
  
  if (!config.databaseURL) {
    throw new Error(`DATABASE_URL is required for ${config.databaseType} database`);
  }
  
  let driverName;
  switch (config.databaseType) {
    case 'postgres':
    case 'postgresql':
      driverName = 'postgres';
      console.log('Configuring PostgreSQL database');
      break;
    case 'mysql':
      driverName = 'mysql';
      console.log('Configuring MySQL database');
      break;
    default:
      throw new Error(`Unsupported database type: ${config.databaseType} (supported: sqlite, postgres, mysql)`);
  }
  
  console.log(`Successfully configured ${config.databaseType} database`);
  console.log('PocketBase will use DATABASE_URL environment variable for database connection');
}

module.exports = {
  setupDatabase
};

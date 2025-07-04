import { Product } from '../src/products/product.entity';
import { Review } from '../src/reviews/review.entity';
import { User } from '../src/users/user.entity';
import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

// dotend config
config({ path: '.env' });

/**
 * DataSource is:
 * - a pre-defined connection configuration to a specific database.
 * DataSourceOptions is:
 * - an interface with settings and options for specific DataSource (database).
 * Scripts: for every change (adding entity, adding column, ...)
 * - npm run typeorm => run the typeorm and give it DataSource
 * - npm run migration:generate => generate mogrations based on the DataSource inside our project (migrations folder). (-- db/migrations/migrationName)
 * - npm run migration:run => transfer (تحويل) changes to the remote database
 * - npm run migration:revert => remove the migration we build
 */

// Data Source Options
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Product, User, Review],
  migrations: ['dist/db/migrations/*.js'],
};

// Data Source === Database
const dataSource = new DataSource(dataSourceOptions);

export default dataSource;

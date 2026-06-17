import { Module, Global, Logger, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export const DB_POOL = 'DB_POOL';

let poolInstance: Pool | null = null;

@Global()
@Module({
  providers: [
    {
      provide: DB_POOL,
      useFactory: () => {
        if (poolInstance) {
          return poolInstance;
        }

        poolInstance = new Pool({
          connectionString: process.env.DATABASE_URL,
        });

        poolInstance.on('connect', () => {
          Logger.log('Database connected', 'DatabaseModule');
        });

        poolInstance.on('error', (err) => {
          Logger.error('Unexpected database error', err.stack, 'DatabaseModule');
          process.exit(-1);
        });

        return poolInstance;
      },
    },
  ],
  exports: [DB_POOL],
})
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() {
    if (poolInstance) {
      Logger.log('Closing database connection pool', 'DatabaseModule');
      await poolInstance.end();
      poolInstance = null;
    }
  }
}

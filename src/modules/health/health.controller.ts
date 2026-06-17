import { Controller, Get, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DB_POOL } from '../../config/database.module';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject(DB_POOL) private pool: Pool) {}

  @Get()
  @ApiOperation({ summary: 'Check application and database health' })
  async check() {
    const dbStatus = await this.checkDatabase();

    return {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
      },
    };
  }

  private async checkDatabase(): Promise<'up' | 'down'> {
    try {
      await this.pool.query('SELECT 1');
      return 'up';
    } catch {
      return 'down';
    }
  }
}

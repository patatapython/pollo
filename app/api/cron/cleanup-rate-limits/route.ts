import { NextRequest, NextResponse } from 'next/server';
import { getRepositories, RepositoryError } from '@/lib/repositories';
import { logger } from '@/lib/logger';

/**
 * GET /api/cron/cleanup-rate-limits
 * Limpia intentos de rate limiting >7 días.
 * Ejecutado diariamente por Vercel Cron.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    let count: number;
    try {
      count = await getRepositories().rateLimits.deleteOlderThan(sevenDaysAgo);
    } catch (error) {
      if (error instanceof RepositoryError) {
        logger.error('Failed to cleanup rate limits', error.cause ?? error);
        return NextResponse.json(
          { error: 'Cleanup failed' },
          { status: 500 }
        );
      }
      throw error;
    }

    logger.info('Rate limit cleanup completed', { deletedRows: count });

    return NextResponse.json({
      success: true,
      deletedRows: count,
      cutoffDate: sevenDaysAgo.toISOString(),
    });
  } catch (error) {
    logger.error('Cron job error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

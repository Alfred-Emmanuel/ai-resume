# Performance Optimization for Job Service

## Current Implementation Analysis

The current `job.ts` service has several performance concerns under immense load:

### Issues Identified:

1. **No Connection Pooling Optimization**
2. **No Caching Layer**
3. **Inefficient Search Queries**
4. **No Rate Limiting**
5. **Missing Database Indexes**
6. **No Bulk Operations**
7. **No Query Optimization**

## Immediate Improvements Made:

### 1. Pagination Limits

- Added maximum limit enforcement (100 for list, 50 for search)
- Prevents memory exhaustion from large result sets

### 2. Search Optimization

- Minimum search term length (2 characters)
- Trimmed search terms to prevent whitespace issues
- Limited search results to prevent expensive queries

### 3. Input Validation

- Safe offset handling (prevents negative values)
- Parameter sanitization

## Additional Optimizations Needed:

### 1. Database Indexes

Add these indexes to improve query performance:

```sql
-- Composite index for user jobs with ordering
CREATE INDEX CONCURRENTLY idx_jobs_user_created ON jobs(user_id, created_at DESC);

-- Full-text search index
CREATE INDEX CONCURRENTLY idx_jobs_search ON jobs USING gin(
  to_tsvector('english', title || ' ' || COALESCE(company, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(description, ''))
);

-- Company and location indexes for filtering
CREATE INDEX CONCURRENTLY idx_jobs_company ON jobs(company) WHERE company IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_jobs_location ON jobs(location) WHERE location IS NOT NULL;
```

### 2. Caching Layer

Implement Redis caching for frequently accessed data:

```typescript
// Add to job service
private async getCachedJobCount(userId: UUID): Promise<number> {
  const cacheKey = `job_count:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return parseInt(cached);

  const count = await this.getJobCount(userId);
  await redis.setex(cacheKey, 300, count.toString()); // 5 min cache
  return count;
}
```

### 3. Connection Pooling

Optimize database connection pool:

```typescript
// In database config
const pool = new Pool({
  connectionString: DATABASE.CONNECTION_STRING,
  max: 20, // Maximum connections
  min: 5, // Minimum connections
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
});
```

### 4. Rate Limiting

Add rate limiting middleware:

```typescript
import rateLimit from "express-rate-limit";

const jobRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many job requests from this IP",
});
```

### 5. Bulk Operations

Add bulk job creation for batch processing:

```typescript
async createJobsBulk(userId: UUID, jobsData: CreateJobData[]): Promise<JobData[]> {
  if (jobsData.length === 0) return [];
  if (jobsData.length > 100) throw new Error('Too many jobs in bulk operation');

  const values = jobsData.map((job, index) =>
    `($1, $${index * 5 + 2}, $${index * 5 + 3}, $${index * 5 + 4}, $${index * 5 + 5}, $${index * 5 + 6})`
  ).join(', ');

  const params = [userId, ...jobsData.flatMap(job => [
    job.title, job.company, job.location, job.description, job.url
  ])];

  const query = `
    INSERT INTO jobs (user_id, title, company, location, description, url)
    VALUES ${values}
    RETURNING *
  `;

  return await this.executeQuery<JobData>(query, params, 'bulk create jobs');
}
```

### 6. Query Optimization

Use prepared statements and query optimization:

```typescript
// Use cursor-based pagination for better performance
async getJobsByUserIdCursor(
  userId: UUID,
  cursor?: string,
  limit: number = 50
): Promise<{ jobs: JobData[], nextCursor?: string }> {
  const maxLimit = Math.min(limit, 100);

  const query = cursor
    ? `SELECT * FROM jobs WHERE user_id = $1 AND created_at < $2 ORDER BY created_at DESC LIMIT $3`
    : `SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`;

  const params = cursor ? [userId, cursor, maxLimit] : [userId, maxLimit];

  const jobs = await this.executeQuery<JobData>(query, params, 'get jobs with cursor');

  const nextCursor = jobs.length === maxLimit
    ? jobs[jobs.length - 1].created_at
    : undefined;

  return { jobs, nextCursor };
}
```

### 7. Full-Text Search

Replace ILIKE with PostgreSQL full-text search:

```typescript
async searchJobsFullText(
  userId: UUID,
  searchTerm: string,
  limit: number = 20
): Promise<JobData[]> {
  const maxLimit = Math.min(limit, 50);
  const trimmedTerm = searchTerm.trim();

  if (trimmedTerm.length < 2) return [];

  const query = `
    SELECT *, ts_rank(
      to_tsvector('english', title || ' ' || COALESCE(company, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(description, '')),
      plainto_tsquery('english', $2)
    ) as rank
    FROM jobs
    WHERE user_id = $1
    AND to_tsvector('english', title || ' ' || COALESCE(company, '') || ' ' || COALESCE(location, '') || ' ' || COALESCE(description, ''))
    @@ plainto_tsquery('english', $2)
    ORDER BY rank DESC, created_at DESC
    LIMIT $3
  `;

  return await this.executeQuery<JobData>(
    query,
    [userId, trimmedTerm, maxLimit],
    'full-text search jobs'
  );
}
```

## Performance Monitoring

### Key Metrics to Track:

1. **Response Times**: P50, P95, P99 latencies
2. **Database Connections**: Pool utilization
3. **Cache Hit Rates**: Redis performance
4. **Query Performance**: Slow query logs
5. **Memory Usage**: Heap and connection memory
6. **Error Rates**: Failed requests and timeouts

### Recommended Tools:

- **APM**: New Relic, DataDog, or AppDynamics
- **Database Monitoring**: pg_stat_statements, pg_stat_activity
- **Caching**: Redis monitoring
- **Load Testing**: Artillery, k6, or JMeter

## Load Testing Recommendations

### Test Scenarios:

1. **Normal Load**: 100 concurrent users
2. **Peak Load**: 1000 concurrent users
3. **Stress Test**: 5000+ concurrent users
4. **Spike Test**: Sudden traffic increases
5. **Endurance Test**: Sustained load over time

### Key Test Cases:

- Job creation with various payload sizes
- Search queries with different terms
- Pagination through large datasets
- Concurrent user operations
- Database connection exhaustion

## Conclusion

The current implementation can handle moderate load but needs significant optimization for production scale. Priority should be:

1. **High Priority**: Database indexes, connection pooling, rate limiting
2. **Medium Priority**: Caching layer, query optimization
3. **Low Priority**: Bulk operations, advanced search features

Implement these optimizations incrementally while monitoring performance metrics.

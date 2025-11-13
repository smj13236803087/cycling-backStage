import { Redis } from '@upstash/redis'
const redis = new Redis({
  url: 'https://tough-octopus-17454.upstash.io',
  token: 'AUQuAAIncDI0Nzc2YmQ1ZGM2NGU0NDI3OTE0YmQwNTI0ZWQzYThkY3AyMTc0NTQ',
})

await redis.set("foo", "bar");
await redis.get("foo");
export default redis
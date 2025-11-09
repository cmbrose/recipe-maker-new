# MongoDB Replica Set Setup for Local Development

## The Issue

Prisma requires MongoDB to be running as a **replica set** to support transactions and some operations. By default, standalone MongoDB doesn't have replica sets enabled.

You'll see this error:
```
Prisma needs to perform transactions, which requires your MongoDB server to be run as a replica set.
```

## Quick Solution: Docker Compose with Replica Set

The easiest way is to run MongoDB with replica set enabled using Docker Compose.

### Option 1: Docker Compose (Recommended)

1. **Create `docker-compose.yml` in the project root:**

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: recipe-maker-mongo
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: echo "try { rs.status() } catch (err) { rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]}) }" | mongosh --port 27017 --quiet
      interval: 5s
      timeout: 30s
      start_period: 0s
      start_interval: 1s
      retries: 30

volumes:
  mongodb_data:
```

2. **Start MongoDB:**

```bash
docker-compose up -d
```

3. **Wait for replica set to initialize (about 10 seconds):**

```bash
# Check status
docker-compose logs mongodb
```

4. **Update your `.env` connection string:**

```env
COSMOS_DB_CONNECTION_STRING="mongodb://localhost:27017/recipe-maker-dev?replicaSet=rs0"
```

Note the `?replicaSet=rs0` at the end - this is required!

5. **Test the connection:**

```bash
pnpm db:push
pnpm db:seed
```

### Option 2: Manual Docker Command

If you prefer not to use Docker Compose:

```bash
# 1. Start MongoDB with replica set
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -v mongodb_data:/data/db \
  mongo:7 \
  --replSet rs0 \
  --bind_ip_all

# 2. Wait a few seconds, then initialize replica set
docker exec mongodb mongosh --eval "rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})"

# 3. Verify replica set is running
docker exec mongodb mongosh --eval "rs.status()"
```

Connection string:
```env
COSMOS_DB_CONNECTION_STRING="mongodb://localhost:27017/recipe-maker-dev?replicaSet=rs0"
```

### Option 3: Azure Cosmos DB (No Setup Required)

Azure Cosmos DB with MongoDB API already supports transactions out of the box - no replica set configuration needed!

1. Create Cosmos DB account with MongoDB API
2. Get connection string from Azure Portal
3. Use it in your `.env`

This is the **easiest option for production** and works perfectly with Prisma.

## Troubleshooting

### Error: "Replica set member state is not PRIMARY"

Wait a few more seconds for the replica set to fully initialize, then try again.

### Error: "Connection refused"

MongoDB hasn't started yet:
```bash
# Check if container is running
docker ps | grep mongodb

# Check logs
docker logs mongodb
```

### Stopping/Restarting MongoDB

```bash
# With Docker Compose
docker-compose stop
docker-compose start
docker-compose down    # Stop and remove containers

# With manual docker
docker stop mongodb
docker start mongodb
docker rm mongodb     # Remove container
```

### Clean Slate (Delete All Data)

```bash
# Stop and remove container + volumes
docker-compose down -v

# Or manually
docker stop mongodb
docker rm mongodb
docker volume rm mongodb_data

# Then start fresh
docker-compose up -d
```

## Alternative: Using Azure Cosmos DB Emulator

The Azure Cosmos DB Emulator (Windows only) already has replica set functionality built-in and works out of the box with Prisma.

[Download Azure Cosmos DB Emulator](https://learn.microsoft.com/en-us/azure/cosmos-db/local-emulator)

## Why Replica Sets?

Prisma uses MongoDB transactions for:
- Ensuring data consistency
- Nested writes (creating related records together)
- Rollback on errors

While this adds complexity for local development, it ensures your code works the same way in production (where Cosmos DB always supports transactions).

## Summary

**For local development:** Use Docker Compose with the config above
**For production:** Use Azure Cosmos DB (transactions supported by default)

This way you get:
- ✅ Full Prisma feature support
- ✅ Consistent behavior dev → production
- ✅ No weird transaction errors
- ✅ Easy setup with Docker Compose

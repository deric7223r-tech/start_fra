#!/bin/bash
set -e

# Fetch ALL parameters from SSM
PARAMS=$(aws ssm get-parameters --with-decryption \
  --names \
    /fra/backend/UPSTASH_REDIS_REST_URL \
    /fra/backend/UPSTASH_REDIS_REST_TOKEN \
    /fra/backend/DATABASE_URL \
    /fra/backend/JWT_SECRET \
    /fra/backend/JWT_REFRESH_SECRET \
    /fra/backend/S3_BUCKET \
    /fra/backend/S3_REGION \
    /fra/backend/S3_MAX_UPLOAD_BYTES \
  --query "Parameters[*].[Name,Value]" --output text --region eu-west-2)

# Parse and export
while read -r name value; do
  varname=$(basename "$name")
  export "$varname=$value"
done <<< "$PARAMS"

# Start the app
exec /usr/bin/node dist/index.js

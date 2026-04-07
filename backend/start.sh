#!/bin/bash
# SKY-Omni Agent — Backend Startup Script
# Usage:
#   export GITHUB_TOKEN=ghp_...
#   ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -z "$GITHUB_TOKEN" ]; then
    echo "ERROR: GITHUB_TOKEN is not set."
    echo "Run:  export GITHUB_TOKEN=ghp_your_token_here"
    exit 1
fi

echo "Starting SKY-Omni Agent backend on http://localhost:9494 ..."
mvn -f "$SCRIPT_DIR/pom.xml" \
    -s "$SCRIPT_DIR/mvn-settings.xml" \
    spring-boot:run

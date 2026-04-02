#!/bin/bash
echo "=== /employee ==="
curl http://localhost:3000/employee | jq
echo "=== /servicereqs ==="
curl http://localhost:3000/servicereqs | jq
echo "=== /assigned ==="
curl http://localhost:3000/assigned | jq
echo "=== /files ==="
curl http://localhost:3000/files | jq


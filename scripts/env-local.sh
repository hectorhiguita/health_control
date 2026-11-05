#!/usr/bin/env bash
# Escribe el archivo de entorno de Vite con las salidas de Terraform.
#   ./scripts/env-local.sh              → .env.local   (npm run dev)
#   ./scripts/env-local.sh .env.production
set -euo pipefail
cd "$(dirname "$0")/.."

DESTINO="${1:-.env.local}"
salida() { terraform -chdir=infra output -raw "$1"; }

cat > "$DESTINO" <<EOF
VITE_REGION=$(salida region)
VITE_USER_POOL_ID=$(salida user_pool_id)
VITE_USER_POOL_CLIENT_ID=$(salida user_pool_client_id)
VITE_DOMINIO_LOGIN=$(salida dominio_login)
VITE_API_URL=$(salida api_url)
EOF

echo "› $DESTINO actualizado"

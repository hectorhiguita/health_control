#!/usr/bin/env bash
# Despliega todo: infraestructura, API y sitio.
#   ./scripts/desplegar.sh            (pide confirmación en terraform apply)
#   ./scripts/desplegar.sh -auto-approve
set -euo pipefail
cd "$(dirname "$0")/.."

echo "› Dependencias de la API"
(cd backend && npm ci --omit=dev --no-audit --no-fund)

echo "› Infraestructura"
terraform -chdir=infra init -input=false >/dev/null
terraform -chdir=infra apply "$@"

salida() { terraform -chdir=infra output -raw "$1"; }

./scripts/env-local.sh .env.production

echo "› Sitio"
npm ci --no-audit --no-fund
npm run build

BUCKET="$(salida bucket_sitio)"
aws s3 sync dist/assets "s3://$BUCKET/assets" --delete \
  --cache-control "public, max-age=31536000, immutable"
aws s3 sync dist "s3://$BUCKET" --delete --exclude "assets/*" \
  --cache-control "no-cache"

aws cloudfront create-invalidation \
  --distribution-id "$(salida distribucion_id)" --paths "/index.html" "/" >/dev/null

echo
echo "Listo: $(salida url_sitio)"

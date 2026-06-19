#!/usr/bin/env bash
# evidence-capture.sh
# Automates Stage 2 and Stage 3 of the QVAC Hackathon evidence bundle.
# Run this after pnpm dev is running and you have a valid auth token.
#
# Usage:
#   chmod +x docs/evidence-capture.sh
#   QVAC_TOKEN="your-supabase-jwt" bash docs/evidence-capture.sh
#
# Output: docs/evidence/ directory with timestamped results

set -euo pipefail

API="http://localhost:3001"
TOKEN="${QVAC_TOKEN:-}"
OUTDIR="docs/evidence/$(date +%Y%m%d-%H%M%S)"

# ─── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
error() { echo -e "${RED}[✕]${NC} $*"; }

# ─── Preflight ─────────────────────────────────────────────────────────────────

echo ""
echo "  QVAC Health — Evidence Capture"
echo "  ================================"
echo ""

mkdir -p "$OUTDIR"

if [[ -z "$TOKEN" ]]; then
  warn "QVAC_TOKEN not set. Auth-protected endpoints will return 401."
  warn "Set it with: export QVAC_TOKEN=\$(your auth token)"
  TOKEN="no-token"
fi

# ─── Stage 1: Health check ─────────────────────────────────────────────────────

info "Stage 1: API health check"
HEALTH=$(curl -s "$API/health")
echo "$HEALTH" | tee "$OUTDIR/health.json" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"
echo ""

# ─── Stage 2: Model registry ──────────────────────────────────────────────────

info "Stage 2: Model registry"
MODEL_STATUS=$(curl -s "$API/models/status")
echo "$MODEL_STATUS" | tee "$OUTDIR/models-status.json" | python3 -m json.tool 2>/dev/null || echo "$MODEL_STATUS"
echo ""

# ─── Stage 3: Code audit — verify no external inference URLs ──────────────────

info "Stage 3: External inference URL audit"
echo "Scanning codebase for external AI API calls..."

FINDINGS=0

for pattern in \
  "api.openai.com" \
  "api.anthropic.com" \
  "api.cohere.ai" \
  "api.replicate.com" \
  "generativelanguage.googleapis.com" \
  "api.mistral.ai" \
  "api.together.xyz"; do

  MATCHES=$(grep -r "$pattern" apps/ packages/ \
    --include="*.ts" --include="*.tsx" --include="*.js" \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=dist \
    -l 2>/dev/null || true)

  if [[ -n "$MATCHES" ]]; then
    error "Found reference to $pattern in: $MATCHES"
    FINDINGS=$((FINDINGS + 1))
  else
    info "No reference to $pattern"
  fi
done

if [[ $FINDINGS -eq 0 ]]; then
  info "✅ Zero external inference API URLs found in codebase"
  echo "PASS: No external inference URLs" >> "$OUTDIR/code-audit.txt"
else
  error "⚠️  Found $FINDINGS external inference URL(s) — review required"
  echo "FAIL: Found $FINDINGS external inference URLs" >> "$OUTDIR/code-audit.txt"
fi
echo ""

# ─── Stage 4: QVAC SDK usage verification ─────────────────────────────────────

info "Stage 4: QVAC SDK usage"
echo ""

SDK_CALLS=$(grep -r "@qvac/sdk\|sdk\.loadModel\|sdk\.completion\|sdk\.ragIngest\|sdk\.ragSearch\|sdk\.unloadModel" \
  packages/qvac-core/src/ \
  --include="*.ts" -n 2>/dev/null || true)

if [[ -n "$SDK_CALLS" ]]; then
  info "SDK calls found:"
  echo "$SDK_CALLS" | tee "$OUTDIR/sdk-usage.txt"
else
  warn "No SDK calls found — check packages/qvac-core/src/"
fi
echo ""

# ─── Stage 5: Benchmark — companion endpoint ──────────────────────────────────

info "Stage 5: Companion endpoint benchmark (requires COMPANION_LLM loaded)"
echo "POST $API/ai/companion"
echo ""

START_MS=$(date +%s%3N)

COMPANION_OUT=$(curl -s -X POST "$API/ai/companion" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"text":"I have been feeling overwhelmed with work lately and cannot seem to switch off."}' \
  --max-time 120 \
  2>/dev/null || echo "ERROR: request failed or model not loaded")

END_MS=$(date +%s%3N)
DURATION=$((END_MS - START_MS))

echo "$COMPANION_OUT" | head -5
echo "..."
echo ""
echo "Duration: ${DURATION}ms" | tee "$OUTDIR/companion-benchmark.txt"
info "Companion benchmark complete"
echo ""

# ─── Stage 6: SOAP endpoint benchmark ────────────────────────────────────────

info "Stage 6: SOAP endpoint benchmark (requires SOAP_LLM loaded)"
echo "POST $API/ai/soap"
echo ""

SAMPLE_NOTES="Patient presents with moderate depression and generalized anxiety. PHQ-9: 14. GAD-7: 12. Reports sleep disturbance, decreased concentration, low mood x 3 weeks. No SI/HI. Mental status: alert, oriented, mood depressed, affect congruent, thought process linear."

START_MS=$(date +%s%3N)

SOAP_OUT=$(curl -s -X POST "$API/ai/soap" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"rawNotes\": \"$SAMPLE_NOTES\", \"patientRef\": \"P-EVIDENCE\"}" \
  --max-time 180 \
  2>/dev/null || echo "ERROR: request failed or model not loaded")

END_MS=$(date +%s%3N)
DURATION=$((END_MS - START_MS))

echo "$SOAP_OUT" | python3 -m json.tool 2>/dev/null | head -20 || echo "$SOAP_OUT"
echo ""
echo "Duration: ${DURATION}ms" | tee "$OUTDIR/soap-benchmark.txt"
info "SOAP benchmark complete"
echo ""

# ─── Stage 7: Hardware info ───────────────────────────────────────────────────

info "Stage 7: Hardware specification"
{
  echo "=== Hardware ==="
  echo "Date: $(date)"
  echo "OS: $(uname -srm)"
  echo ""

  if command -v sysctl &>/dev/null; then
    # macOS
    echo "CPU: $(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo unknown)"
    echo "RAM: $(( $(sysctl -n hw.memsize 2>/dev/null || echo 0) / 1024 / 1024 / 1024 ))GB"
  elif [[ -f /proc/cpuinfo ]]; then
    # Linux
    echo "CPU: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
    echo "RAM: $(free -g | awk '/^Mem:/{print $2}')GB"
  fi

  echo "Node.js: $(node --version)"
  echo ""

  echo "=== QVAC Model Cache ==="
  if [[ -d ".qvac-models" ]]; then
    du -sh .qvac-models/ 2>/dev/null || echo "Cache dir not found"
    ls -lh .qvac-models/ 2>/dev/null || true
  else
    echo "No .qvac-models directory found"
  fi
} | tee "$OUTDIR/hardware.txt"
echo ""

# ─── Summary ──────────────────────────────────────────────────────────────────

info "Evidence bundle written to: $OUTDIR/"
echo ""
echo "  Files:"
ls "$OUTDIR/" | sed 's/^/    /'
echo ""
echo "  Next steps:"
echo "    1. Add Network tab screenshots to $OUTDIR/ manually"
echo "    2. Add offline-inference screenshot to $OUTDIR/"
echo "    3. Zip the $OUTDIR/ folder and attach to Dorahacks submission"
echo ""

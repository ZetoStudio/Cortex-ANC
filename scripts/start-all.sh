#!/usr/bin/env bash
# Start the full Cortex demo stack in the background (Ollama + Docker + services + web).
set -euo pipefail
cd "$(dirname "$0")/.."

PID_DIR=".cortex-pids"
mkdir -p "$PID_DIR"
LOG_DIR=".cortex-logs"
mkdir -p "$LOG_DIR"

log() { echo "[start:all] $*"; }

ensure_env() {
  if [ ! -f .env ]; then
    cp .env.example .env
    log "Created .env from .env.example"
  fi
  if ! grep -q NEXTAUTH_SECRET .env 2>/dev/null; then
    echo "NEXTAUTH_SECRET=cortex-demo-secret-change-in-prod" >> .env
  fi
  if ! grep -q NEXTAUTH_URL .env 2>/dev/null; then
    echo "NEXTAUTH_URL=http://localhost:3000" >> .env
  fi
}

start_ollama() {
  if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
    log "Ollama already running on :11434"
    return
  fi
  if ! command -v ollama >/dev/null 2>&1; then
    log "WARNING: Ollama not installed — skip (Groq will be used)"
    return
  fi
  # macOS: launch the Ollama app (more reliable than ollama serve in nohup)
  if [[ "$(uname)" == "Darwin" ]] && [ -d "/Applications/Ollama.app" ]; then
    log "Opening Ollama.app..."
    open -a Ollama 2>/dev/null || true
  else
    log "Starting ollama serve in background..."
    nohup ollama serve >>"$LOG_DIR/ollama.log" 2>&1 &
    echo $! >"$PID_DIR/ollama.pid"
  fi
  for i in $(seq 1 45); do
    if curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
      log "Ollama ready"
      break
    fi
    sleep 1
  done
  if ! curl -sf http://localhost:11434/api/tags >/dev/null 2>&1; then
    log "WARNING: Ollama not reachable — Groq will be used as primary"
    return
  fi
  log "Pulling models (llama3:8b, nomic-embed-text) if missing..."
  ollama pull llama3:8b >>"$LOG_DIR/ollama.log" 2>&1 || true
  ollama pull nomic-embed-text >>"$LOG_DIR/ollama.log" 2>&1 || true
}

start_docker() {
  log "Starting Docker infra..."
  docker compose up -d
  sleep 4
}

start_service() {
  local name="$1"
  local filter="$2"
  local pidfile="$PID_DIR/${name}.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    log "$name already running (pid $(cat "$pidfile"))"
    return
  fi
  log "Starting ${name}..."
  nohup bun run --filter "$filter" dev >>"$LOG_DIR/${name}.log" 2>&1 &
  echo $! >"$pidfile"
}

start_web() {
  local pidfile="$PID_DIR/web.pid"
  if [ -f "$pidfile" ] && kill -0 "$(cat "$pidfile")" 2>/dev/null; then
    log "Web already running (pid $(cat "$pidfile"))"
    return
  fi
  log "Starting Next.js web on :3000..."
  nohup bun run dev >>"$LOG_DIR/web.log" 2>&1 &
  echo $! >"$pidfile"
}

stop_all() {
  log "Stopping Cortex background processes..."
  for pidfile in "$PID_DIR"/*.pid; do
    [ -f "$pidfile" ] || continue
    pid=$(cat "$pidfile")
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      log "Stopped pid $pid"
    fi
    rm -f "$pidfile"
  done
  log "Done. Docker containers left running (use: docker compose down)"
}

case "${1:-start}" in
  stop)
    stop_all
    ;;
  start)
    ensure_env
    start_ollama
    start_docker
    start_service integration-service '@cortex/integration-service'
    start_service event-consumer '@cortex/event-consumer'
    start_service temporal-worker '@cortex/temporal-worker'
    start_web
    echo ""
    echo "✅ Cortex stack running in background"
    echo "   Web:          http://localhost:3000"
    echo "   Ollama:       http://localhost:11434"
    echo "   LiteLLM:      http://localhost:4000"
    echo "   Temporal UI:  http://localhost:8088"
    echo "   Kafka UI:     http://localhost:9080"
    echo "   Logs:         .cortex-logs/"
    echo "   Stop:         bun run start:all:stop"
    echo ""
    echo "Demo logins (password: password):"
    echo "   admin@cortex.anc | ceo@cortex.anc | client@cortex.anc"
    ;;
  *)
    echo "Usage: $0 [start|stop]"
    exit 1
    ;;
esac

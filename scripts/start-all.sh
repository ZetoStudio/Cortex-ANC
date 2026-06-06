#!/usr/bin/env bash
# Start the full Cortex demo stack in the background (Docker + services + web).
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
  # Groq-only for demo (Ollama disabled)
  if grep -q '^LLM_PROVIDER=' .env 2>/dev/null; then
    sed -i.bak 's/^LLM_PROVIDER=.*/LLM_PROVIDER=groq/' .env && rm -f .env.bak
  else
    echo "LLM_PROVIDER=groq" >> .env
  fi
}

# Ollama disabled for demo — Groq via LiteLLM only.
# start_ollama() { ... }

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
    if curl -sf http://localhost:3000 >/dev/null 2>&1; then
      log "Web already running (pid $(cat "$pidfile"))"
      return
    fi
    kill "$(cat "$pidfile")" 2>/dev/null || true
    rm -f "$pidfile"
  fi
  # Clear stale Next.js dev lock / orphaned processes on :3000
  if lsof -ti :3000 >/dev/null 2>&1; then
    log "Clearing stale process on port 3000..."
    lsof -ti :3000 | xargs kill -9 2>/dev/null || true
    sleep 1
  fi
  rm -f apps/web/.next/dev/lock 2>/dev/null || true
  log "Starting Next.js web on :3000..."
  (cd apps/web && nohup bun run dev >>"../../$LOG_DIR/web.log" 2>&1 &)
  sleep 2
  # PID of next dev (more reliable than nohup subshell)
  local web_pid
  web_pid=$(lsof -ti :3000 2>/dev/null | head -1)
  if [ -n "$web_pid" ]; then
    echo "$web_pid" >"$pidfile"
  fi
  for i in $(seq 1 60); do
    if curl -sf http://localhost:3000 >/dev/null 2>&1; then
      log "Web ready at http://localhost:3000"
      return
    fi
    sleep 1
  done
  log "WARNING: Web may still be starting — check .cortex-logs/web.log"
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
    start_docker
    start_service integration-service '@cortex/integration-service'
    start_service event-consumer '@cortex/event-consumer'
    start_service temporal-worker '@cortex/temporal-worker'
    start_web
    echo ""
    echo "✅ Cortex stack running in background (Groq only)"
    echo "   Web:          http://localhost:3000"
    echo "   LiteLLM:      http://localhost:4000"
    echo "   Temporal UI:  http://localhost:8088"
    echo "   Kafka UI:     http://localhost:9080"
    echo "   Logs:         .cortex-logs/"
    echo "   Stop:         bun run start:all:stop"
    echo ""
    echo "Open http://localhost:3000/auth/login — choose CEO or Client"
    ;;
  *)
    echo "Usage: $0 [start|stop]"
    exit 1
    ;;
esac

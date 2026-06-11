#!/bin/bash
echo "🚀 SIGEA - Pipeline de Desarrollo"
echo "================================="

case $1 in
  "generate")
    echo "📝 Freebuff: Genera código desde prompts/"
    ls prompts/
    ;;
  "audit")
    echo "🔍 Ruflo: Auditando código..."
    npx ruflo audit src/
    ;;
  "full")
    bash pipeline.sh generate
    bash pipeline.sh audit
    ;;
  *)
    echo "Uso: bash pipeline.sh [generate|audit|full]"
    ;;
esac
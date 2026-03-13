#!/usr/bin/env bash
set -e

celery -A app.workers.celery_app.celery_app worker --loglevel=info

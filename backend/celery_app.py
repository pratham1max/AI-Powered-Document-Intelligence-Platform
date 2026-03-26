from celery import Celery
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

app = Celery(
    "docplatform",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "tasks.parse_tasks",
        "tasks.crypto_tasks",
    ],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    task_routes={
        "tasks.crypto_tasks.*": {"queue": "crypto"},
        "tasks.parse_tasks.*": {"queue": "default"},
    },
)

import os
import uuid
import httpx
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.models.profile import SkinProfile
from app.models.notification import Notification

scheduler = AsyncIOScheduler()

# Documented transparent fallback coordinates: National Geographic Center, India
FALLBACK_LATITUDE = 20.5937
FALLBACK_LONGITUDE = 78.9629

async def generate_routine_reminders():
    """
    Periodic cron job generating AM/PM routine reminders and real-time UV alerts.
    Enforces idempotency and deduplication via unique dedup_keys per user per day.
    """
    now_utc = datetime.now(timezone.utc)
    today_str = now_utc.strftime("%Y-%m-%d")
    current_hour_utc = now_utc.hour

    try:
        profiles = await SkinProfile.find_all().to_list()
    except Exception as e:
        print(f"[SCHEDULER ERROR] Could not retrieve skin profiles: {e}")
        return

    # 1. Real-time UV Alert check (runs during daytime ~ 02:00 - 11:00 UTC, i.e. 7:30 AM - 4:30 PM IST)
    real_uv_index = None
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(
                f"https://api.open-meteo.com/v1/forecast?latitude={FALLBACK_LATITUDE}&longitude={FALLBACK_LONGITUDE}&hourly=uv_index&timezone=auto"
            )
            if resp.status_code == 200:
                data = resp.json()
                uv_list = data.get("hourly", {}).get("uv_index", [])
                if uv_list:
                    # Get maximum UV expected today
                    real_uv_index = max(uv_list[:24])
    except Exception as uv_err:
        print(f"[SCHEDULER UV ALERT] Open-Meteo external service notice: {uv_err}")

    for p in profiles:
        uid = str(p.user_id)

        # AM Routine Reminder Window (e.g. morning cycle)
        if current_hour_utc in [1, 2, 3]: # ~6:30 - 8:30 AM IST
            am_dedup = f"am_routine_{uid}_{today_str}"
            existing = await Notification.find_one(Notification.dedup_key == am_dedup)
            if not existing:
                notif = Notification(
                    user_id=uid,
                    reminder_uuid=str(uuid.uuid4()),
                    dedup_key=am_dedup,
                    title="Morning Routine Reminder",
                    message="Good morning! Time to execute your AM cleanse, hydrate, and SPF routine.",
                    type="reminder"
                )
                await notif.insert()

            # High UV Alert
            if real_uv_index is not None and real_uv_index >= 3.0:
                uv_dedup = f"uv_alert_{uid}_{today_str}"
                existing_uv = await Notification.find_one(Notification.dedup_key == uv_dedup)
                if not existing_uv:
                    uv_notif = Notification(
                        user_id=uid,
                        reminder_uuid=str(uuid.uuid4()),
                        dedup_key=uv_dedup,
                        title="High UV Index Alert",
                        message=f"Live Solar Forecast: Real-time UV index will reach {real_uv_index:.1f} today. Ensure broad-spectrum SPF 50+ is applied and reapplied every 2 hours.",
                        type="uv_alert"
                    )
                    await uv_notif.insert()

        # PM Routine Reminder Window (e.g. evening cycle)
        elif current_hour_utc in [13, 14, 15]: # ~6:30 - 8:30 PM IST
            pm_dedup = f"pm_routine_{uid}_{today_str}"
            existing = await Notification.find_one(Notification.dedup_key == pm_dedup)
            if not existing:
                notif = Notification(
                    user_id=uid,
                    reminder_uuid=str(uuid.uuid4()),
                    dedup_key=pm_dedup,
                    title="Evening Routine Reminder",
                    message="Time for your PM Recovery Routine! Complete double cleansing and active treatment application.",
                    type="reminder"
                )
                await notif.insert()

def init_scheduler():
    """
    Initializes APScheduler with idempotent job configuration to prevent duplicate
    reminders on service reloads or multi-process spawns.
    """
    if not scheduler.running:
        scheduler.add_job(
            generate_routine_reminders,
            'cron',
            minute=0,
            id='hourly_routine_reminders',
            replace_existing=True,
            misfire_grace_time=300
        )
        scheduler.start()
        print("[SCHEDULER] APScheduler initialized successfully with hourly idempotent cron job.")

from wakepy import keep
import time as TimeLib
from datetime import datetime
import subprocess

auto_run_times = ["9:45", "09:45", "18:45",]

with keep.running():
    while True: 
        now = datetime.now()
        time = now.strftime("%H:%M")
        if time in auto_run_times: 
            try:
                print(f"Running automation at {time}")
                result = subprocess.run(["npx", "playwright", "test"], capture_output=True, text=True, check=True, timeout=60)
                print(f"Return code: {result.returncode}")
            except subprocess.TimeoutExpired as e:
                print(f"Subprocess timed out and was terminated {e.stderr} {e.stdout}")
            except subprocess.CalledProcessError as e:
                print(f"Error executing command: {e.stdout}")
                print(f"Stderr: {e.stderr}")
        TimeLib.sleep(60)


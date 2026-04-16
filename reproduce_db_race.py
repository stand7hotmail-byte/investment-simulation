
import threading
import time
from backend.app.database import get_engine, _engine

def concurrent_init():
    engine = get_engine()
    print(f"Engine init: {id(engine)}")

threads = []
for i in range(10):
    t = threading.Thread(target=concurrent_init)
    threads.append(t)

for t in threads:
    t.start()

for t in threads:
    t.join()

print(f"Final _engine instance ID: {id(_engine)}")

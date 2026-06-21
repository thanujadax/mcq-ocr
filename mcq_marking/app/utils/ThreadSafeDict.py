import threading

class ThreadSafeDict:
    def __init__(self):
        self._lock = threading.Lock()
        self._dict = {}

    def set(self, key, value):
        with self._lock:
            self._dict[key] = value

    def get(self, key, default=None):
        with self._lock:
            return self._dict.get(key, default)

    def pop(self, key, default=None):
        with self._lock:
            return self._dict.pop(key, default)

    def has(self, key):
        with self._lock:
            return key in self._dict

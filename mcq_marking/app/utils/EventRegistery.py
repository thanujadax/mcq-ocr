import threading
# this class is used to register events under a given key and set or get them later

class EventRegistery:
    def __init__(self):
        self._lock = threading.Lock()
        self._registor = {} # type: dict[str, threading.Event]
    def create_event(self, key):
        ''' create an event under the given key, if the key already exists, overwrite it
            return the event object'''
        with self._lock:
            self._registor[key] = threading.Event() # overwrite if exists
        return self._registor[key]
    def get_event(self, key):
        ''' get the event object under the given key, if the key does not exist, return None'''
        with self._lock:
            return self._registor.get(key, None)
    def set_event(self, key):
        ''' set the event under the given key, if the key does not exist, do nothing'''
        with self._lock:
            event = self._registor.get(key, None)
            if event:
                event.set()
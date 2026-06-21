 # Create a user object that has both dict-like and object-like access
class UserState:
    def __init__(self, user_dict):
        self._data = user_dict
        # Set attributes for object access
        for key, value in user_dict.items():
            setattr(self, key, value)
     
    def __getitem__(self, key):
        return self._data[key]
    
    def __contains__(self, key):
        return key in self._data
    
    def get(self, key, default=None):
        return self._data.get(key, default)
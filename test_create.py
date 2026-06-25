import urllib.request
import urllib.parse
import json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=urllib.parse.urlencode({"username": "9999999999", "password": "password"}).encode())
try:
    with urllib.request.urlopen(req) as response:
        token = json.loads(response.read())["access_token"]
except Exception as e:
    req = urllib.request.Request("http://localhost:8000/api/v1/auth/login", data=urllib.parse.urlencode({"username": "8888888888", "password": "password"}).encode())
    with urllib.request.urlopen(req) as response:
        token = json.loads(response.read())["access_token"]

payload = {
  "category": "Plumber",
  "location": {
    "latitude": 12.0,
    "longitude": 14.0
  },
  "address_details": {
    "house_flat": "123",
    "landmark": "Near X",
    "city": "Test",
    "zip_code": "000000"
  },
  "problem_description": "Test",
  "urgency_level": "NORMAL"
}

req2 = urllib.request.Request("http://localhost:8000/api/v1/bookings/", data=json.dumps(payload).encode(), headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
try:
    with urllib.request.urlopen(req2) as response:
        print(response.getcode())
except urllib.error.HTTPError as e:
    print(e.code)
    print(e.read().decode())

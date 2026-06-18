# Ranzo - FastAPI backend + React Native frontend (Android + iOS)

# Landing Screen:
 - Get Started
 - On clicking "get started" -> Login/Register Screen

# Login/Register Screen:
 - Some widgets + Login / Register button

 - On clicking Login button -> Login Screen
 - On clicking Register button -> Register Screen

```
-  OTP mechanism for phone verfication while registration + OTP login + Forgot Password OTP mechanism
-  JWT tokens with no expiry. Only delete JWT on logout. (Stored in Local Store)
```

# Login Screen:
 - Form = Number + Password + Login + Forgot Password

# Registration Screen:
 - Form = 
    - Name (length = 3 - 30) 
    - Phone number (validation 0-9) 
    - Verify button (for number) - validate if number already exists. if not send otp and verify otp. TTL = 1min
    - Password (Strength Validation) - Uppercse + Lowercase + special char + number - (min - 8 chars)
    - Register button

# Home Screen:
 - Two cards:
    - Home Services (Click on this -> `Home services` role selection, Roles: [customer, techincian])
        - Desc: Register your skill, Book a technician
    - Job Portal (Click on this -> `Job Portal` role selection, Roles: [seeker, employer])
        - Desc: 

 - Profile icon (Navigates to ProfileSummary Screen -> Showing the Roles the user has registered in)

After selecting a role: If role not registerd or role profile not completed -> Profile Setup

**NOTE:** 
- Profile Setup for each role will be different but will use same endpoint with query parameter as `role`
- All endpoints related to Profile (not ProfileSummary) will require an mandatory query paramaeter `role`

-----
Collections in MongoDB:

- users
```
{
    id:
    name:
    phone:
    registered_roles: [] # customer, technician, seeker, employer
}
```

**As soon as the user is created, Save empty profile documents in below collections**

- customer_profile
```
{
    id:
    user_id: ForeignKey(users.id)
    location: 
    is_completed:
}
```

- technician_profile
```
{
    id: 
    user_id: ForeignKey(users.id)
    skills: [] (Maximum 3, Minimum 1)
    location: 
    online_status: 
    is_completed:
}
``

- seeker_profile
```
{
    id:
    user_id: ForeignKey(users.id)
    category:
    role: (Based on category)
    location: 
    is_completed:
}
```

- employer
```
{
    id:
    user_id: ForeignKey(users.id)
    company:
    location:
    is_completed:
}
```
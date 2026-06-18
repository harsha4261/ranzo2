# Home services

All screen common elements for `Customer` role:
- Footer nav:
    - Home -> Navigate to Home screen i.e `Frontend/home.tsx`
    - Dashboard -> Present one `active_bookings_list` which show list of `bookings` of a customer from the user that are currently active.
    - Book ( `+` icon) -> Booking a technician
    - History -> Booking History Screen

- header right:
    - Profile ( `person` icon) -> Navigate to role specificProfile screen. (Allows role specific profile view and edit)



---

Collections used in this phase:

- bookings
```
{
    id: 
    customer_id: ForeignKey(customer_profile.id)
    technician_id: ForeignKey(technician_profile.id)
    booking_datetime:
    status:
    location:
    category:
}
```

- reviews
```
{
    id: 
    customer_id: ForeignKey(customer_profile.id)
    technician_id: ForeignKey(technician_profile.id)
    booking_id: ForeignKey(bookings.id)
    customer_rating:
    technician_rating: 
    customer_review:
    technician_review:
}
```

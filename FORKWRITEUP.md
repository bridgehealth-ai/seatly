This fork implements a “recurring booking” feature. 


Also, to the extent time permitted, it improves architecture by enforcing previously-disregarded SOLID principals, improving “DRY”s and enabling easier feature additions and scaling.


## New Feature Implemented: "Recurring Booking" — users may now:


1. Create a recurring booking for a desk.
2. See recurring bookings reflected in their calendar.
3. Be protected from making new recurring bookings which conflict with existing ones.
4. Be protected from entering erroneous dates (via date range input validation).


## Design/Implementation Problems 


Additional improvements to security, scalability and performance result from refactored/redesigned architecture.  The previous design implementation suffered from:


1. No separation of concerns/tight coupling of view to http: Prior to redesign, React components “knew” they were making HTTP calls (through TanStack Query), and directly received unrequited error and other http data.  This presented, among other disadvantages, a security risk.


2. Tight coupling/lack of abstraction and reusability complicates new feature implementation, scaling. 


3. No clear contracts: The application lacked meaningful interfaces defining available operations.


4. Dependency inversion and diregard for encapsulation: Components depended on entire implementation details (headers, error parsing, status codes) even though they *should only* care about "create a desk" - (1. IE call() 2. Get back Desk OR 3. meaningful error messaging/info).


## Design/Implementation Solutions


### Problem 1: UI components coupled with http transaction methods.   UI components shouldn't be directly concerned with how data is retrieved, and the details of such transactions should be encapsulated elsewhere.  UI components should have one job: displaying the data.
  
### Solution: Components now depend on SeatlyApiClient methods, and are segregated from HTTP implementation details.
Another  advantage: improved scalability (new API works for 10 or 100 endpoints) without refactoring individual components (saving developer time, allowing faster dev cycles).


### Problem 2: Changing http logic repeated in each component would require a mountain of refactoring.  App also lacked abstracted, reusable page element components


### Solution: By abstracting http logic to a single api it is easy to swap for other API frameworks, protocols and tools (ie GraphQL/WebSockets/React Query). 


Also, *added reusable, importable button components and input component* and deleted repetitive jax.


### Problem 3: No clear contracts between frontend concerns. 


### Solution: Addressed by adding interfaces, for example, see frontend/src/types/booking.ts.


### Problem 4: DIP violation and lack of encapsulation.  This is a poor security practice with resulting potential for exposure of private/sensitive information. 


### Solution: new, unified api, and abstraction of http requests add more privacy.  This is also cleaner code, excluding details a display component does not need.


## Backend-specific additions and improvements


1. New Recurring Booking Endpoint


POST /desks/{deskId}/bookings/recurring
Accepts start/end times + recurrence end date
Returns list of all created bookings


2. Business Logic (DeskManager.kt)


createRecurringBooking() method with @Transactional
calculateRecurringDates() helper function
Atomic validation (checks ALL dates before creating ANY bookings)


3. New Types/DTOs


CreateRecurringBookingRequest (controller layer)
CreateRecurringBookingCommand (business layer)


4. Tests (DeskControllerTest.kt)


Three new test cases validating recurring booking behavior



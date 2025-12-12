package com.seatly.desk

import com.seatly.user.CreateUserRequest
import com.seatly.user.LoginRequest
import com.seatly.user.LoginResponse
import com.seatly.user.UserRepository
import com.seatly.user.UserResponse
import io.micronaut.core.type.Argument
import io.micronaut.http.HttpRequest
import io.micronaut.http.HttpStatus
import io.micronaut.http.client.HttpClient
import io.micronaut.http.client.annotation.Client
import io.micronaut.http.client.exceptions.HttpClientResponseException
import io.micronaut.test.extensions.junit5.annotation.MicronautTest
import jakarta.inject.Inject
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.LocalDateTime
import java.time.temporal.ChronoUnit

@MicronautTest(transactional = false)
class RecurringBookingServiceTest {

  @Inject
  @field:Client("/")
  lateinit var client: HttpClient

  @Inject
  lateinit var deskRepository: DeskRepository

  @Inject
  lateinit var userRepository: UserRepository

  @Inject
  lateinit var bookingRepository: BookingRepository

  private lateinit var authUser: UserResponse
  private lateinit var authToken: String

  @BeforeEach
  fun setUp() {
    bookingRepository.deleteAll()
    deskRepository.deleteAll()
    userRepository.deleteAll()

    val createUserRequest = CreateUserRequest(
      email = "test@example.com",
      password = "password123",
      fullName = "Test User"
    )
    authUser = client.toBlocking().retrieve(
      HttpRequest.POST("/users", createUserRequest),
      Argument.of(UserResponse::class.java)
    )

    val loginRequest = LoginRequest(
      email = "test@example.com",
      password = "password123"
    )
    val loginResponse = client.toBlocking().retrieve(
      HttpRequest.POST("/users/login", loginRequest),
      LoginResponse::class.java
    )

    authToken = loginResponse.token
  }

  @Test
  fun `should create recurring bookings successfully without conflicts`() {

    val desk: DeskResponse =
      createDesk(
        client = client,
        authToken = authToken,
        name = "Booking Desk 1",
        location = "Booking Floor 1",
      )
    val deskId = desk.id!!

    val now = LocalDateTime.now().plusHours(1)

    val duration = 2L
    val createBookingRequest =
      CreateBookingRequest(
        startAt = now,
        endAt = now.plusHours(1),
        recurrence_type = "WEEKLY",
        duration = duration,
      )

    val bookingsResponse =
      client.toBlocking().exchange(
        HttpRequest
          .POST("desks/$deskId/recurrence-bookings", createBookingRequest)
          .bearerAuth(authToken),
        Argument.listOf(BookingResponse::class.java),
      )
      
    assertEquals(HttpStatus.CREATED, bookingsResponse.status)
    val bookings = bookingsResponse.body()
    assertNotNull(bookings)

    val booking = bookings[0]
    assertNotNull(booking)
    assertEquals(deskId, booking!!.deskId)
    assertEquals(authUser.id, booking.userId)
    assertEquals(createBookingRequest.startAt.truncatedTo(ChronoUnit.MINUTES), booking.startAt)
    assertEquals(createBookingRequest.endAt.truncatedTo(ChronoUnit.MINUTES), booking.endAt)
  }

  @Test
  fun `should reject recurring booking with conflicts`() {
    val desk: DeskResponse =
      createDesk(
        client = client,
        authToken = authToken,
        name = "Booking Desk 1",
        location = "Booking Floor 1",
      )
    val deskId = desk.id!!

    val now = LocalDateTime.now().plusHours(1)

    val startAt = now
    val endAt = now.plusHours(1)

    val createBookingRequest =
      CreateBookingRequest(
        startAt = startAt,
        endAt = endAt,
      )

    client.toBlocking().exchange(
    HttpRequest
        .POST("desks/$deskId/bookings", createBookingRequest)
        .bearerAuth(authToken),
    BookingResponse::class.java,
    )

    val duration = 2L
    val createRecurrenceBookingRequest =
      CreateBookingRequest(
        startAt = startAt,
        endAt = endAt,
        recurrence_type = "WEEKLY",
        duration = duration,
      )
      
    val exception = assertThrows(HttpClientResponseException::class.java) {
        client.toBlocking().exchange(
        HttpRequest
          .POST("desks/$deskId/recurrence-bookings", createRecurrenceBookingRequest)
          .bearerAuth(authToken),
        Argument.listOf(BookingResponse::class.java),
      )
    }

    assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, exception.status)
  }


  @Test
  fun `should reject creating booking without token`() {
    val desk: DeskResponse =
      createDesk(
        client = client,
        authToken = authToken,
        name = "Booking Desk 1",
        location = "Booking Floor 1",
      )
    val deskId = desk.id!!

    val now = LocalDateTime.now().plusHours(1)

    val startAt = now
    val endAt = now.plusHours(1)
    val duration = 2L

    val createRecurrenceBookingRequest =
      CreateBookingRequest(
        startAt = startAt,
        endAt = endAt,
        recurrence_type = "WEEKLY",
        duration = duration,
      )
    
     val exception = assertThrows(HttpClientResponseException::class.java) {
            client.toBlocking().exchange(
            HttpRequest
            .POST("desks/$deskId/recurrence-bookings", createRecurrenceBookingRequest),
            Argument.listOf(BookingResponse::class.java),
        )
    }

    assertEquals(HttpStatus.UNAUTHORIZED, exception.status)    
  }

  fun `should throw IllegalArgumentException when recurrence_type is not WEEKLY`() {
    val desk: DeskResponse =
      createDesk(
        client = client,
        authToken = authToken,
        name = "Booking Desk 1",
        location = "Booking Floor 1",
      )
    val deskId = desk.id!!

    val now = LocalDateTime.now().plusHours(1)

    val startAt = now
    val endAt = now.plusHours(1)
    val duration = 2L

    val invalidRecurrenceType = "DAILY"

    val createRecurrenceBookingRequest =
      CreateBookingRequest(
        startAt = startAt,
        endAt = endAt,
        recurrence_type = invalidRecurrenceType,
        duration = duration,
      )      
    val exception = assertThrows(IllegalArgumentException::class.java) {
        client.toBlocking().exchange(
            HttpRequest
            .POST("desks/$deskId/recurrence-bookings", createRecurrenceBookingRequest),
            Argument.listOf(BookingResponse::class.java),
        )
    }

    assertEquals("Only weekly recurrence is supported", exception.message)
    }
}

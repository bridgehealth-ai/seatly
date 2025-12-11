package com.seatly.desk

import io.micronaut.http.HttpResponse
import io.micronaut.http.HttpStatus
import io.micronaut.http.annotation.Body
import io.micronaut.http.annotation.Controller
import io.micronaut.http.annotation.Get
import io.micronaut.http.annotation.PathVariable
import io.micronaut.http.annotation.Post
import io.micronaut.http.annotation.QueryValue
import io.micronaut.security.annotation.Secured
import io.micronaut.security.authentication.Authentication
import io.micronaut.security.rules.SecurityRule
import io.micronaut.serde.annotation.Serdeable
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import java.time.LocalDateTime

@Controller("/desks")
open class DeskController(
  private val deskManager: DeskManager,
) {
  @Post
  @Secured(SecurityRule.IS_AUTHENTICATED)
  open fun createDesk(
    @Body @Valid request: CreateDeskRequest,
  ): HttpResponse<DeskResponse> {
    val created = deskManager.createDesk(request.toCommand())
    val responseBody = DeskResponse.from(created)
    return HttpResponse.status<DeskResponse>(HttpStatus.CREATED).body(responseBody)
  }

  @Get
  @Secured(SecurityRule.IS_AUTHENTICATED)
  open fun listDesks(): HttpResponse<List<DeskResponse>> {
    val desks = deskManager.listDesks()
    val responseBody = desks.map { DeskResponse.from(it) }
    return HttpResponse.ok(responseBody)
  }

  @Get("{deskId}/availability")
  @Secured(SecurityRule.IS_AUTHENTICATED)
  open fun getDeskAvailability(
    @PathVariable deskId: Long,
    @QueryValue startAt: LocalDateTime,
    @QueryValue endAt: LocalDateTime,
  ): HttpResponse<List<AvailabilityResponse>> {
    val availability =
      deskManager.listDeskAvailability(
        deskId = deskId,
        startAt = startAt,
        endAt = endAt,
      )
    val responseBody = availability.map { AvailabilityResponse.from(it) }
    return HttpResponse.ok(responseBody)
  }

  @Post("{deskId}/bookings")
  @Secured(SecurityRule.IS_AUTHENTICATED)
  open fun createBooking(
    authentication: Authentication,
    @PathVariable deskId: Long,
    @Body @Valid request: CreateBookingRequest,
  ): HttpResponse<BookingResponse> {
    val created =
      deskManager.createBooking(
        command =
          request.toCommand(
            deskId = deskId,
            userId = authentication.name.toLong(),
          ),
      )
    val responseBody = BookingResponse.from(created)
    return HttpResponse.created(responseBody)
  }

  @Post("{deskId}/bookings/recurring")
  @Secured(SecurityRule.IS_AUTHENTICATED)
  open fun createRecurringBooking(
    authentication: Authentication,
    @PathVariable deskId: Long,
    @Body @Valid request: CreateRecurringBookingRequest,
  ): HttpResponse<List<BookingResponse>> {
    val created =
      deskManager.createRecurringBooking(
        command =
          request.toCommand(
            deskId = deskId,
            userId = authentication.name.toLong(),
          ),
      )
    val responseBody = created.map { BookingResponse.from(it) }
    return HttpResponse.created(responseBody)
  }
}

@Serdeable
data class CreateDeskRequest(
  @field:NotBlank
  val name: String,
  val location: String? = null,
) {
  fun toCommand(): CreateDeskCommand =
    CreateDeskCommand(
      name = name,
      location = location,
    )
}

@Serdeable
data class DeskResponse(
  val id: Long?,
  val name: String,
  val location: String?,
) {
  companion object {
    fun from(desk: DeskDto): DeskResponse =
      DeskResponse(
        id = desk.id,
        name = desk.name,
        location = desk.location,
      )
  }
}

@Serdeable
data class AvailabilityResponse(
  val startAt: LocalDateTime,
  val endAt: LocalDateTime,
  val status: AvailabilityStatus,
) {
  companion object {
    fun from(availabilityDto: AvailabilityDto): AvailabilityResponse =
      AvailabilityResponse(
        startAt = availabilityDto.startAt,
        endAt = availabilityDto.endAt,
        status = availabilityDto.status,
      )
  }
}

@Serdeable
data class CreateBookingRequest(
  @field:NotNull
  val startAt: LocalDateTime,
  @field:NotNull
  val endAt: LocalDateTime,
) {
  fun toCommand(
    deskId: Long,
    userId: Long,
  ): CreateBookingCommand =
    CreateBookingCommand(
      deskId = deskId,
      userId = userId,
      startAt = startAt,
      endAt = endAt,
    )
}

@Serdeable
data class CreateRecurringBookingRequest(
  @field:NotNull
  val startAt: LocalDateTime,
  @field:NotNull
  val endAt: LocalDateTime,
  @field:NotNull
  val recurrenceEndDate: java.time.LocalDate,
) {
  fun toCommand(
    deskId: Long,
    userId: Long,
  ): CreateRecurringBookingCommand =
    CreateRecurringBookingCommand(
      deskId = deskId,
      userId = userId,
      startAt = startAt,
      endAt = endAt,
      recurrenceEndDate = recurrenceEndDate,
    )
}

@Serdeable
data class BookingResponse(
  val id: Long,
  val deskId: Long,
  val userId: Long,
  val startAt: LocalDateTime,
  val endAt: LocalDateTime,
) {
  companion object {
    fun from(booking: BookingDto): BookingResponse =
      BookingResponse(
        id = booking.id,
        deskId = booking.deskId,
        userId = booking.userId,
        startAt = booking.startAt,
        endAt = booking.endAt,
      )
  }
}

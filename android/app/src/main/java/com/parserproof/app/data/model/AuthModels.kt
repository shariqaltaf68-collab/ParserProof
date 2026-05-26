package com.parserproof.app.data.model

import com.google.gson.annotations.SerializedName

data class SignupRequest(
    val name: String,
    val email: String,
    val password: String
)

data class SignupResponse(
    val status: String,
    val email: String,
    val developmentFallback: Boolean,
    val smtpError: String?,
    val message: String?
)

data class VerifyRequest(
    val email: String,
    val code: String
)

data class VerifyResponse(
    val success: Boolean,
    val message: String?
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class ForgotPasswordRequest(
    val email: String
)

data class ForgotPasswordResponse(
    val success: Boolean,
    val message: String?
)

data class UserSession(
    val id: String,
    val name: String,
    val email: String,
    val plan: String,
    val image: String?
)

data class SessionResponse(
    val user: UserSession?
)

data class CsrfResponse(
    val csrfToken: String
)

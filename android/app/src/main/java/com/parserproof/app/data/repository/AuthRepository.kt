package com.parserproof.app.data.repository

import com.parserproof.app.data.api.RetrofitClient
import com.parserproof.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {
    private val apiService by lazy { RetrofitClient.getService() }

    private fun <T> handleError(response: retrofit2.Response<T>, defaultMsg: String): Result<Nothing> {
        if (response.code() == 404) {
            return Result.failure(Exception("Server error (404): The requested endpoint was not found on the server. Please check your backend routes."))
        }
        val errorBody = response.errorBody()?.string() ?: ""
        val errorMsg = if (errorBody.contains("<!DOCTYPE html>") || errorBody.contains("<html>") || errorBody.length > 200) {
            "Server error (${response.code()}): Unexpected response format from server."
        } else {
            errorBody.ifEmpty { defaultMsg }
        }
        return Result.failure(Exception(errorMsg))
    }

    suspend fun signup(request: SignupRequest): Result<SignupResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.signup(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                handleError(response, "Signup failed")
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verify(request: VerifyRequest): Result<VerifyResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.verify(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                handleError(response, "Verification failed")
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun forgotPassword(email: String): Result<ForgotPasswordResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.forgotPassword(ForgotPasswordRequest(email))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                handleError(response, "Failed to send reset link")
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun login(credentials: LoginRequest): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val csrfResponse = apiService.getCsrfToken()
            val csrfToken = if (csrfResponse.isSuccessful && csrfResponse.body() != null) {
                csrfResponse.body()!!.csrfToken
            } else {
                "dummy-csrf"
            }

            val response = apiService.login(credentials.email, credentials.password, csrfToken)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                handleError(response, "Invalid email or password")
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSession(): Result<UserSession?> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getSession()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.user)
            } else {
                handleError(response, "Failed to retrieve session")
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun logout() {
        RetrofitClient.logout()
    }
}

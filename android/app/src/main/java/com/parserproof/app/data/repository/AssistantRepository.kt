package com.parserproof.app.data.repository

import com.parserproof.app.data.api.RetrofitClient
import com.parserproof.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AssistantRepository {
    private val apiService by lazy { RetrofitClient.getService() }

    suspend fun getAssistantHistory(): Result<AssistantHistoryResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getAssistantHistory()
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to load assistant history"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun chatWithAssistant(request: AssistantChatRequest): Result<AssistantChatResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.chatWithAssistant(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to send message to assistant"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun clearAssistantHistory(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.clearAssistantHistory()
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to clear assistant history"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}

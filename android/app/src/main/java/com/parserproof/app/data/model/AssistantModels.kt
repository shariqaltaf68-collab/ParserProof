package com.parserproof.app.data.model

import com.google.gson.annotations.SerializedName

data class ChatMessage(
    val role: String, // "user" or "assistant"
    val content: String,
    val createdAt: String? = null
)

data class AssistantHistoryResponse(
    val messages: List<ChatMessage> = emptyList(),
    val isGuest: Boolean = true,
    val limit: Int = 5,
    val remainingMessages: Int = 5
)

data class AssistantChatRequest(
    val message: String,
    val projectId: String?,
    val history: List<ChatMessage> = emptyList(),
    val displayMessage: String? = null
)

data class ChatAction(
    val type: String, // "APPEND_SKILLS", "REPLACE_SKILLS", "DELETE_SECTION", "REPLACE_TEXT", "APPEND_TEXT", "UPDATE_FULL_RESUME"
    val skills: List<String>? = null,
    val section: String? = null,
    val target: String? = null,
    val replacement: String? = null,
    val text: String? = null,
    val improvedResume: String? = null
)

data class AssistantChatResponse(
    val response: String,
    val actions: List<ChatAction> = emptyList(),
    val remainingMessages: Int = 0,
    val isGuest: Boolean = true,
    val limit: Int = 5
)

data class EditResumeRequest(
    val actions: List<ChatAction>
)

data class EditResumeResponse(
    val success: Boolean,
    val project: ProjectSnippet
)

data class ProjectSnippet(
    val id: String,
    val resumeText: String,
    val improvedResume: String?,
    val atsScore: Int?,
    val keywordMatch: String?
)

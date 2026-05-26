package com.parserproof.app.data.api

import com.parserproof.app.data.model.*
import okhttp3.MultipartBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @POST("api/auth/signup")
    suspend fun signup(
        @Body request: SignupRequest
    ): Response<SignupResponse>

    @POST("api/auth/verify")
    suspend fun verify(
        @Body request: VerifyRequest
    ): Response<VerifyResponse>

    @GET("api/auth/csrf")
    suspend fun getCsrfToken(): Response<CsrfResponse>

    @FormUrlEncoded
    @POST("api/auth/signin/credentials")
    suspend fun login(
        @Field("email") email: String,
        @Field("password") password: String,
        @Field("csrfToken") csrfToken: String = "dummy-csrf",
        @Field("redirect") redirect: String = "false",
        @Field("json") json: String = "true"
    ): Response<Void>

    @POST("api/auth/forgot-password")
    suspend fun forgotPassword(
        @Body request: ForgotPasswordRequest
    ): Response<ForgotPasswordResponse>

    @GET("api/auth/session")
    suspend fun getSession(): Response<SessionResponse>

    @Multipart
    @POST("api/resume/upload")
    suspend fun uploadResume(
        @Part file: MultipartBody.Part
    ): Response<ResumeUploadResponse>

    @POST("api/generate")
    suspend fun generateProject(
        @Body request: CreateProjectRequest
    ): Response<ProjectResponse>

    @GET("api/projects")
    suspend fun getProjects(
        @Query("limit") limit: Int? = null,
        @Query("search") search: String? = null,
        @Query("status") status: String? = null
    ): Response<ProjectsListResponse>

    @GET("api/projects/{id}")
    suspend fun getProjectDetails(
        @Path("id") projectId: String
    ): Response<ProjectResponse>

    @DELETE("api/projects/{id}")
    suspend fun deleteProject(
        @Path("id") projectId: String
    ): Response<Void>

    @GET("api/projects/{id}/battleground")
    suspend fun getBattleground(
        @Path("id") projectId: String
    ): Response<BattlegroundResponse>

    @POST("api/projects/{id}/edit")
    suspend fun editProject(
        @Path("id") projectId: String,
        @Body request: EditResumeRequest
    ): Response<EditResumeResponse>

    @GET("api/assistant")
    suspend fun getAssistantHistory(): Response<AssistantHistoryResponse>

    @POST("api/assistant")
    suspend fun chatWithAssistant(
        @Body request: AssistantChatRequest
    ): Response<AssistantChatResponse>

    @DELETE("api/assistant")
    suspend fun clearAssistantHistory(): Response<Void>
}

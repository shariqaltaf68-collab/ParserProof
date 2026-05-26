package com.parserproof.app.data.repository

import com.parserproof.app.data.api.RetrofitClient
import com.parserproof.app.data.model.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class ProjectRepository {
    private val apiService by lazy { RetrofitClient.getService() }

    suspend fun uploadResume(file: File): Result<ResumeUploadResponse> = withContext(Dispatchers.IO) {
        try {
            val requestFile = file.asRequestBody("application/pdf".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("file", file.name, requestFile)
            val response = apiService.uploadResume(body)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to upload and parse resume"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun generateProject(request: CreateProjectRequest): Result<Project> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.generateProject(request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.project)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Generation failed"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProjects(limit: Int? = null, search: String? = null): Result<List<Project>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getProjects(limit, search)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.projects)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to load projects history"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProjectDetails(projectId: String): Result<Project> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getProjectDetails(projectId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.project)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to load project details"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteProject(projectId: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.deleteProject(projectId)
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to delete project"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getBattleground(projectId: String): Result<CohortStats> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getBattleground(projectId)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.stats)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to load cohort benchmarking"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun editProject(projectId: String, actions: List<ChatAction>): Result<ProjectSnippet> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.editProject(projectId, EditResumeRequest(actions))
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.project)
            } else {
                val errorMsg = response.errorBody()?.string() ?: "Failed to edit resume"
                Result.failure(Exception(errorMsg))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
